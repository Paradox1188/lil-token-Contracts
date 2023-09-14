// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IMinter {
    /*----------  FUNCTIONS  --------------------------------------------*/
    function update_period() external returns (uint256);
    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/
    /*----------  VIEW FUNCTIONS  ---------------------------------------*/
    function team() external view returns (address);
    function weekly() external view returns (uint256);
}