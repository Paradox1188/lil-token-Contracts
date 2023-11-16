// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IScaleLP {
    function tokens() external view returns (address, address);
}

interface IPairFactory {
    function isPair(address _pair) external view returns (bool);
}

interface IScaleVoter {
    function gauges(address _lpToken) external view returns (address);
}

interface IScaleGauge {
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function getReward() external;
}

contract ScaleGaugePlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable scaleGauge;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _scaleGauge,
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        string memory _protocol,
        string memory _symbol
    )
        Plugin(
            _underlying, 
            _voter, 
            _tokensInUnderlying, 
            _bribeTokens,
            _protocol
        )
    {
        scaleGauge = _scaleGauge;
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IScaleGauge(scaleGauge).getReward();
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        for (uint i = 0; i < getBribeTokens().length; i++) {
            address token = getBribeTokens()[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > duration) {
                IERC20(token).safeApprove(bribe, 0);
                IERC20(token).safeApprove(bribe, balance);
                IBribe(bribe).notifyRewardAmount(token, balance);
            }
        }
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);
        IERC20(getUnderlyingAddress()).safeApprove(scaleGauge, 0);
        IERC20(getUnderlyingAddress()).safeApprove(scaleGauge, amount);
        IScaleGauge(scaleGauge).deposit(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IScaleGauge(scaleGauge).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public view override returns (string memory) {
        return symbol;
    }

    function getUnderlyingSymbol() public view override returns (string memory) {
        return symbol;
    }

}

contract ScaleGaugePluginFactory {

    address public constant SCALE = 0x54016a4848a38f257B6E96331F7404073Fd9c32C;
    address public constant POOL_FACTORY = 0xEd8db60aCc29e14bC867a497D94ca6e3CeB5eC04;
    address public constant SCALE_VOTER = 0x46ABb88Ae1F2a35eA559925D99Fdc5441b592687;
    string public constant PROTOCOL = 'Equalizer';

    address public immutable VOTER;

    address public last_plugin;

    error PluginFactory__NotPair();
    error PluginFactory__InvalidGauge();

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _lpToken,
        string memory _symbol // ex sLP-USDT/USDC or vLP-DAI/ETH
    ) external returns (address) {
        if (!IPairFactory(POOL_FACTORY).isPair(_lpToken)) revert PluginFactory__NotPair();
        if (IScaleVoter(SCALE_VOTER).gauges(_lpToken) == address(0)) revert PluginFactory__InvalidGauge();
        (address token0, address token1) = IScaleLP(_lpToken).tokens();

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = token0;
        tokensInUnderlying[1] = token1;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = SCALE;

        ScaleGaugePlugin lastPlugin = new ScaleGaugePlugin(
            _lpToken,
            IScaleVoter(SCALE_VOTER).gauges(_lpToken),
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            PROTOCOL,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }
    
}