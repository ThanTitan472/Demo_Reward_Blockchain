const fs = require('fs');
class TaskContract {
	constructor() {
			this.tasks;
			this.nextTaskId;
	}
	// load data in json file
	LoadData()
	{
		fs.readFile('contract.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc file:', err);
        return;
      }
      if(data)
				{
        	this.tasks = JSON.parse(data);
					this.nextTaskId = Object.keys(this.tasks).length;
				}
      else
        {
					this.tasks = {};
					this.nextTaskId = 0;
				}
    });
	}
	//create task in contract
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
					creator: creator,
					assignee: null,
					diff: diff,
					reward: reward, 
					status: 0 // 0: Created, 1: Assigned, 2: Completed, 3: Paid
			};
			console.log(`TaskCreated: ${taskId}, ${description}, ${creator}, difficult: ${diff}, reward: ${reward}`);
	}
	// assign task in contract
	assignTask(taskId, assignee,creatorid) {
			const task = this.tasks[taskId];
			if (task.creator !== creatorid) { 
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
	// accept task in contract
	acceptTask(taskId, solution,assigneeid) {
			const task = this.tasks[taskId];
			if (task.assignee !== assigneeid) { 
					throw new Error("Only assignee can accept task");
			}
			if (task.status !== 1) {
					throw new Error("Task must be assigned");
			}

			task.status = 2;

			console.log(`TaskCompleted: ${taskId}, ${task.assignee},${solution}`);
	}
	// pay reward after finished task
	payReward(taskId,creatorid,balancecreator) {
			const task = this.tasks[taskId];
			if (task.creator !== creatorid) { 
					throw new Error("Only creator can pay reward");
			}
			if (task.status !== 2) {
					throw new Error("Task must be completed");
			}
			if (task.reward > balancecreator) { 
					throw new Error("Insufficient balance in contract");
			}

			// Giả định việc chuyển tiền
			console.log(`TaskPaid: ${taskId}, ${task.assignee} nhan duoc ${task.reward}`);
	}
	// save Data
	saveData()
	{
		const data = JSON.stringify(this.tasks, null, 2);
    fs.writeFile('contract.json', data, 'utf8', err => {
      if (err) throw err;
      console.log('Saved Tasks');
    });
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