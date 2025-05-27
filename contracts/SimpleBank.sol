// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleBank {
    address public owner;

    mapping(address => uint256) private balances;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Пользователь вносит депозит
    function deposit() external payable {
        require(msg.value > 0, "Must biggen than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public {
      require(balances[msg.sender] >= amount, "Insufficient balance");
      balances[msg.sender] -= amount;
      payable(msg.sender).transfer(amount);
    }

    // Пользователь смотрит свой баланс
    function getMyBalance() external view returns (uint256) {
        return balances[msg.sender];
    }

    // Владелец может снять средства с контракта
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Not enough balance");
        payable(owner).transfer(amount);
        emit Withdraw(owner, amount);
    }

    // Просмотр баланса контракта
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
