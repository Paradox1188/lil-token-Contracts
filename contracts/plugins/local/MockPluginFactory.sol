// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import 'contracts/Plugin.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount * (10**18));
    }
}

contract MockPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public constant DURATION = 604800;
    string public symbol;

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
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
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        for (uint256 i = 0; i < getBribeTokens().length; i++) {
            ERC20Mock(getBribeTokens()[i]).mint(address(this), 10);
        }
        for (uint256 i = 0; i < getBribeTokens().length; i++) {
            address token = getBribeTokens()[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > DURATION && token != getUnderlyingAddress()) {
                IERC20(token).safeApprove(getBribe(), 0);
                IERC20(token).safeApprove(getBribe(), balance);
                IBribe(getBribe()).notifyRewardAmount(token, balance);
            }
        }
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

contract MockPluginFactory is Ownable {

    address public immutable VOTER;
    mapping(string => address) tokens;

    address public last_plugin;

    event Plugin__LPMockPluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createLPMockPlugin(string memory lpSymbol, string memory symbol0, string memory symbol1) external returns (address plugin) {

        address token0 = tokens[symbol0] == address(0) ? createERC20Mock(symbol0) : tokens[symbol0];
        address token1 = tokens[symbol1] == address(0) ? createERC20Mock(symbol1) : tokens[symbol1];
        address lpToken = tokens[lpSymbol] == address(0) ? createERC20Mock(lpSymbol) : tokens[lpSymbol];

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = token0;
        tokensInUnderlying[1] = token1;

        MockPlugin lastPlugin = new MockPlugin(
            address(lpToken),
            VOTER,
            tokensInUnderlying,
            tokensInUnderlying,
            "LPMockPlugin",
            lpSymbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__LPMockPluginCreated(last_plugin);
        return last_plugin;
    }

    function createLPMockFarmPlugin(string memory lpSymbol, string memory symbol0, string memory symbol1, string memory rewardSymbol) external returns (address plugin) {

        address token0 = tokens[symbol0] == address(0) ? createERC20Mock(symbol0) : tokens[symbol0];
        address token1 = tokens[symbol1] == address(0) ? createERC20Mock(symbol1) : tokens[symbol1];
        address reward = tokens[rewardSymbol] == address(0) ? createERC20Mock(rewardSymbol) : tokens[rewardSymbol];
        address lpToken = tokens[lpSymbol] == address(0) ? createERC20Mock(lpSymbol) : tokens[lpSymbol];

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = token0;
        tokensInUnderlying[1] = token1;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = reward;

        MockPlugin lastPlugin = new MockPlugin(
            address(lpToken),
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            "LPMockFarmPlugin",
            lpSymbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__LPMockPluginCreated(last_plugin);
        return last_plugin;
    }

    function createSingleStakePlugin(string memory tokenSymbol, string memory rewardSymbol) external returns (address plugin) {

        address token = tokens[tokenSymbol] == address(0) ? createERC20Mock(tokenSymbol) : tokens[tokenSymbol];
        address reward = tokens[rewardSymbol] == address(0) ? createERC20Mock(rewardSymbol) : tokens[rewardSymbol];

        address[] memory tokensInUnderlying = new address[](1);
        tokensInUnderlying[0] = token;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = reward;

        MockPlugin lastPlugin = new MockPlugin(
            token,
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            "SingleStakePlugin",
            tokenSymbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__LPMockPluginCreated(last_plugin);
        return last_plugin;
    }

    function createERC20Mock(string memory symbol) internal returns (address) {
        ERC20Mock token = new ERC20Mock(symbol, symbol);
        tokens[symbol] = address(token);
        return address(token);
    }


}