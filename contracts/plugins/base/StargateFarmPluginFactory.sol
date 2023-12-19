// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IStargateLP {
    function token() external view returns (address);
}
 
interface IMasterChef {
    function poolInfo(uint256 _pid) external view returns (address lpToken, uint256 allocPoint, uint256 lastRewardTime, uint256 accEmissionPerShare);
    function deposit(uint256 _pid, uint256 _amount) external;
    function withdraw(uint256 _pid, uint256 _amount) external;
}

contract StargateFarmPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant MASTER_CHEF = 0x06Eb48763f117c7Be887296CDcdfad2E4092739C;

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public immutable pid;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        string memory _protocol,
        uint256 _pid,
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
        pid = _pid;
        symbol = _symbol;
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);
        IERC20(getUnderlyingAddress()).safeApprove(MASTER_CHEF, 0);
        IERC20(getUnderlyingAddress()).safeApprove(MASTER_CHEF, amount);
        IMasterChef(MASTER_CHEF).deposit(pid, amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IMasterChef(MASTER_CHEF).withdraw(pid, amount); 
        super.withdrawTo(account, amount);
    }

    function claimAndDistribute()
        public
        override
    {
        super.claimAndDistribute();
        IMasterChef(MASTER_CHEF).deposit(pid, 0);
        address token = getBribeTokens()[0];
        address bribe = getBribe();
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 duration = IBribe(bribe).DURATION();
        if (balance > duration) {
            IERC20(token).safeApprove(bribe, 0);
            IERC20(token).safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(token, balance);
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

contract StargateFarmPluginFactory {

    address public constant STG = 0xE3B53AF74a4BF62Ae5511055290838050bf764Df;
    address public constant MASTER_CHEF = 0x06Eb48763f117c7Be887296CDcdfad2E4092739C;
    string public constant PROTOCOL = 'Stargate';

    address public immutable VOTER;

    address public last_plugin;

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        uint256 _pid,
        string memory _symbol // ex SG-ETH-LP
    ) external returns (address) {
        (address lpToken, , ,) = IMasterChef(MASTER_CHEF).poolInfo(_pid);
        address token = IStargateLP(lpToken).token();

        address[] memory tokensInUnderlying = new address[](1);
        tokensInUnderlying[0] = token;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = STG;

        StargateFarmPlugin lastPlugin = new StargateFarmPlugin(
            lpToken,
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            PROTOCOL,
            _pid,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }
    
}