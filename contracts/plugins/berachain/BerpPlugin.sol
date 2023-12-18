// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IBank {
    function getBalance(address accountAddress, string calldata denom) external view returns (uint256);
}

interface IBGT {
    function redeem(address from, address receiver, uint256 amount) external;
}

interface IRewarder {
    function withdrawAllDepositorRewards(address receiver) external;
}

contract BexPairPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant BGT = 0x09E585D2bdEb5ecf90ADE67dCE1125070D2714a3;
    address public constant BANK = 0x4381dC2aB14285160c808659aEe005D51255adD7;
    address public constant REWARDER = 0x55684e2cA2bace0aDc512C1AFF880b15b8eA7214;

    string public constant PROTOCOL = 'BERP';
    string public constant SYMBOL = 'bHONEY';

    /*----------  STATE VARIABLES  --------------------------------------*/

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter,
        address _bHoney,
        address[] memory _tokensInUnderlying,
        address[] memory _bribeTokens
    )
        Plugin(
            _bHoney, 
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
        IRewarder(REWARDER).withdrawAllDepositorRewards(address(this));
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        address token = getBribeTokens()[0];
        uint256 balance = IBank(BANK).getBalance(address(this), "abgt");
        if (balance > duration) {
            IBGT(BGT).redeem(address(this), address(this), balance);
            IERC20(token).safeApprove(bribe, 0);
            IERC20(token).safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(token, balance);
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public view override returns (string memory) {
        return SYMBOL;
    }

    function getUnderlyingSymbol() public view override returns (string memory) {
        return SYMBOL;
    }

}