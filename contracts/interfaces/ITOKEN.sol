// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface ITOKEN {
    /*----------  FUNCTIONS  --------------------------------------------*/
    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/
    /*----------  VIEW FUNCTIONS  ---------------------------------------*/
    function BASE() external view returns (address);
    function OTOKEN() external view returns (address);
    function VTOKEN() external view returns (address);
    function totalSupply() external view returns (uint256);
    function frBASE() external view returns (uint256);
    function mrvBASE() external view returns (uint256);
    function mrrBASE() external view returns (uint256);
    function mrrTOKEN() external view returns (uint256);
    function getFloorPrice() external view returns (uint256);
    function getMaxSell() external view returns (uint256);
    function getMarketPrice() external view returns (uint256);
    function getOTokenPrice() external view returns (uint256);
    function getTotalValueLocked() external view returns (uint256);
    function getAccountCredit(address account) external view returns (uint256) ;
    function debts(address account) external view returns (uint256);
    function FEES() external view returns (address);
    function PROTOCOL_FEE() external view returns (uint256);
    function DIVISOR() external view returns (uint256);
    function PRECISION() external view returns (uint256);
}

