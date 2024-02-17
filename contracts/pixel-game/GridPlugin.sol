// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGridNFT {
    function distribute() external;
}

contract GridPlugin is Plugin, Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    string public constant PROTOCOL = '31CS';
    uint256 public constant DURATION = 604800;

    /*----------  STATE VARIABLES  --------------------------------------*/

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__NotAuthorizedGridNFT();

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier onlyGridNFT() {
        if (msg.sender != getUnderlyingAddress()) revert Plugin__NotAuthorizedGridNFT();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying,   // GridNFT contract
        address[] memory _bribeTokens           // oToken
    )
        Plugin(
            _underlying,
            _voter,
            _tokensInUnderlying,
            _bribeTokens,
            PROTOCOL
        )
    {}

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IGridNFT(getUnderlyingAddress()).distribute();
        address token = getBribeTokens()[0];
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > DURATION) {
            IERC20(token).safeApprove(getBribe(), 0);
            IERC20(token).safeApprove(getBribe(), balance);
            IBribe(getBribe()).notifyRewardAmount(token, balance);
        }
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
        onlyGridNFT
    {
        emit Plugin__Deposited(account, amount);
        IGauge(getGauge())._deposit(account, amount);
    }

    function withdrawTo(address account, uint256 amount)
        public
        override
        onlyGridNFT
    {
        emit Plugin__Withdrawn(account, amount);
        IGauge(getGauge())._withdraw(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingDecimals() public view override returns (uint8) {
        return 0;
    }
    
}