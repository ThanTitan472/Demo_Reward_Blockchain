// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract TaskContract {

    struct Task {
        uint256 id;
        string description;
        address creator;
        address assignee;
        uint256 diff;
        uint256 reward; // Giá trị giả định
        uint256 status; // 0: Created, 1: Assigned, 2: Completed, 3: Paid
    }

    mapping(uint256 => Task) public tasks;
    uint256 public nextTaskId = 0;

    event TaskCreated(uint256 taskId, string description, address creator);
    event TaskAssigned(uint256 taskId, address assignee);
    event TaskCompleted(uint256 taskId, address assignee);
    event TaskPaid(uint256 taskId, address assignee);

    function createTask(string memory _description, uint256 _diff, uint256 _reward) public {
        require(_diff > 0, "Difficuft must be greater than 0");
        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            description: _description,
            creator: msg.sender,
            assignee: address(0),
            diff: _diff,
            reward: _reward, // Giá trị giả định 1 đơn vị tiền tệ local
            status: 0
        });

        emit TaskCreated(taskId, _description, msg.sender);
    }

    function assignTask(uint256 _taskId, address _assignee) public {
        require(tasks[_taskId].creator == msg.sender, "Only creator can assign task");
        require(tasks[_taskId].status == 0, "Task must be created");
        require(_assignee != address(0), "Assignee cannot be empty");

        tasks[_taskId].assignee = _assignee;
        tasks[_taskId].status = 1;

        emit TaskAssigned(_taskId, _assignee);
    }

    function acceptTask(uint256 _taskId) public {
        require(tasks[_taskId].assignee == msg.sender, "Only assignee can accept task");
        require(tasks[_taskId].status == 1, "Task must be assigned");

        tasks[_taskId].status = 2;

        emit TaskCompleted(_taskId, msg.sender);
    }

    function payReward(uint256 _taskId) public {
        require(tasks[_taskId].creator == msg.sender, "Only creator can pay reward");
        require(tasks[_taskId].status == 2, "Task must be completed");
        require(tasks[_taskId].reward <= msg.sender.balance, "Insufficient balance in contract");

        address payable assignee = payable(tasks[_taskId].assignee);
        assignee.transfer(tasks[_taskId].reward);
        tasks[_taskId].status = 3;

        // Thay vì chuyển giao tiền thật, ta chỉ ghi chép lại việc thanh toán
        emit TaskPaid(_taskId, tasks[_taskId].assignee);
    }
}