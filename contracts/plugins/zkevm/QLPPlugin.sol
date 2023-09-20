// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IRewardRouter {
    function handleRewards(bool _shouldConvertWethToEth, bool _shouldAddIntoQLP) external;
}

contract QLPPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant SQLP = 0x973ae30Cb49986E1D3BdCAB4d40B96fEA5baBE84;
    address public constant REWARD_ROUTER = 0x4141b44f0e8b53aDcAc97D87a3c524d70e5e23B7;
    string public constant PROTOCOL = 'QuickSwap';
    string public constant SYMBOL = 'QLP';

    /*----------  STATE VARIABLES  --------------------------------------*/

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter, 
        address[] memory _tokensInUnderlying,   // QLP
        address[] memory _bribeTokens           // WETH, USDC, QUICK
    )
        Plugin(
            SQLP, 
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
        IRewardRouter(REWARD_ROUTER).handleRewards(false, false);
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        for (uint i = 0; i < getBribeTokens().length ; i++) {
            address token = getBribeTokens()[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > duration) {
                IERC20(token).safeApprove(bribe, 0);
                IERC20(token).safeApprove(bribe, balance);
                IBribe(bribe).notifyRewardAmount(token, balance);
            }
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public pure override returns (string memory) {
        return SYMBOL;
    }

    function getUnderlyingSymbol() public pure override returns (string memory) {
        return SYMBOL;
    }

}