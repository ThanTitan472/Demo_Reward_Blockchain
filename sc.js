const { Wallet } = require("./Blockchain");

class TaskContract {
	constructor() {
			this.tasks = {};
			this.nextTaskId = 0;
	}
	createTask(creator,description, diff, reward) {
			if (diff <= 0) {
					throw new Error("Difficulty must be greater than 0");
			}
			if (!creator) {
				throw new Error("Creator cannot be empty");
			}
			const taskId = this.nextTaskId++;
			this.tasks[taskId] = {
					id: taskId,
					description: description,
					creator: creator, // Thay thế bằng địa chỉ thực của người tạo
					assignee: null,
					diff: diff,
					reward: reward, // Giá trị giả định
					status: 0 // 0: Created, 1: Assigned, 2: Completed, 3: Paid
			};
			////////////////
			sendTask(`TaskCreated: ${taskId}, ${description}, ${creator}, difficult: ${diff}, reward: ${reward}`);
			reciveTask();
			////////////////
			console.log(`TaskCreated: ${taskId}, ${description}, ${creator}, difficult: ${diff}, reward: ${reward}`);
	}

	assignTask(taskId, assignee,creatorid) {
			const task = this.tasks[taskId];
			if (task.creator !== creatorid) { // Thay thế bằng địa chỉ thực của người tạo
					throw new Error("Only creator can assign task");
			}
			if (task.status !== 0) {
					throw new Error("Task must be created");
			}
			if (!assignee) {
					throw new Error("Assignee cannot be empty");
			}

			task.assignee = assignee;
			task.status = 1;

			console.log(`TaskAssigned: ${taskId}, ${assignee}`);
	}

	acceptTask(taskId, solution,assigneeid) {
			const task = this.tasks[taskId];
			if (task.assignee !== assigneeid) { // Thay thế bằng địa chỉ thực của người nhận
					throw new Error("Only assignee can accept task");
			}
			if (task.status !== 1) {
					throw new Error("Task must be assigned");
			}

			task.status = 2;

			console.log(`TaskCompleted: ${taskId}, ${task.assignee},${solution}`);
			sendResponse(`TaskCompleted: ${taskId}, assigneeAddress`);
			reviceResponse();
	}

	payReward(taskId,creatorid,balancecreator) {
			const task = this.tasks[taskId];
			if (task.creator !== creatorid) { // Thay thế bằng địa chỉ thực của người tạo
					throw new Error("Only creator can pay reward");
			}
			if (task.status !== 2) {
					throw new Error("Task must be completed");
			}
			if (task.reward > balancecreator) { // Thay thế bằng số dư thực tế của người tạo
					throw new Error("Insufficient balance in contract");
			}

			// Giả định việc chuyển tiền
			console.log(`TaskPaid: ${taskId}, ${task.assignee} nhan duoc ${task.reward}`);
	}
}
module.exports.TaskContract = TaskContract;
function sendTask(task){
	localStorage.setItem('Task',task);
}
function reciveTask(){
	window.addEventListener('storage', function(event) {
    if (event.key === 'Task') {
        console.log('Task: ' + event.newValue);
		}
	});
}
function sendResponse(response)
{
	localStorage.setItem('Response',response);
}
function reviceResponse(){
	window.addEventListener('storage', function(event) {
    if (event.key === 'Response') {
        console.log('Response: ' + event.newValue);
		}
	});
}
// Sử dụng
// const taskContract = new TaskContract();
// taskContract.createTask("Than","1+1 ?", 1, 100); // Giả định
// taskContract.createTask("Than","1+2 ?", 1, 150);