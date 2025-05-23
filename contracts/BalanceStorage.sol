// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BalanceStorage {
    // Мапа: адрес -> баланс
    mapping(address => uint256) private balances;

    // Положить деньги в контракт
    function deposit() external payable {
        require(msg.value > 0, "Zero deposit");
        balances[msg.sender] += msg.value;
    }

    // Отправить деньги другому
    function send(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    // Узнать свой баланс
    function getMyBalance() external view returns (uint256) {
        return balances[msg.sender];
    }
}
