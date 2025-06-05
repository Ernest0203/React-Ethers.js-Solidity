// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDEX {
    IERC20 public token;

    uint256 public reserveETH;
    uint256 public reserveToken;

    constructor(address _token) {
        token = IERC20(_token);
    }

    // Добавление ликвидности — ETH + токен
    function addLiquidity(uint256 tokenAmount) external payable {
        require(msg.value > 0, "Send ETH");
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");

        reserveETH += msg.value;
        reserveToken += tokenAmount;
    }

    // Формула Uniswap для расчета вывода с учётом комиссии 0.3%
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "Zero input");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");

        uint256 amountInWithFee = amountIn * 997; // 0.3% комиссия
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    // Свап ETH на токены
    function swapETHForToken() external payable {
        require(msg.value > 0, "Send ETH");

        uint256 amountOut = getAmountOut(msg.value, reserveETH, reserveToken);
        require(reserveToken >= amountOut, "Not enough tokens in reserve");

        // Обновляем резервы
        reserveETH += msg.value;
        reserveToken -= amountOut;

        require(token.transfer(msg.sender, amountOut), "Token transfer failed");
    }

    // Свап токенов на ETH
    function swapTokenForETH(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Zero tokens");

        uint256 amountOut = getAmountOut(tokenAmount, reserveToken, reserveETH);
        require(reserveETH >= amountOut, "Not enough ETH in reserve");

        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");

        // Обновляем резервы
        reserveToken += tokenAmount;
        reserveETH -= amountOut;

        // Отправляем ETH
        (bool sent, ) = msg.sender.call{value: amountOut}("");
        require(sent, "ETH transfer failed");
    }

    // Просмотр резервов
    function getReserves() external view returns (uint256, uint256) {
        return (reserveETH, reserveToken);
    }
}
