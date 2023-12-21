// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IVoter {
    function vote(address[] calldata plugins, uint256[] calldata weights) external;
    function claimBribes(address[] memory bribes) external;
}

interface IVTOKENRewarder {
    function getReward(address account) external;
}

interface IVTOKEN {
    function deposit(uint256 amount) external;
    function burnFor(address account, uint256 amount) external;
}

interface ITOKEN {
    function getAccountCredit(address account) external view returns (uint256);
    function buy(uint256 amountBase, uint256 minToken, uint256 expireTimestamp, address toAccount, address provider) external;
    function borrow(uint256 amountBase) external;
}

interface IMulticall {
    function quoteBuyIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput);
}

contract ManagerLiquidity {

    address internal immutable base;
    address internal immutable lsToken;

    constructor(address _base) {
        lsToken = msg.sender;
        base = _base;
    }

    function claimFeesFor(address recipient, uint amount) external {
        require(msg.sender == lsToken);
        if (amount > 0) IERC20(base).transfer(recipient, amount);
    }

}

contract Manager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant SLIPPAGE_TOLERANCE = 9500; // 5% slippage tolerance

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public feeToHolders = 1000;    // fee to holders   (0 < feeToHolders < 2500)
    uint256 public feeToLiquidity = 1000;  // fee to liquidity (0 < feeToLiquidity < 2500)

    address public immutable lsToken;
    address public immutable base;
    address public immutable token;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;

    address public liquidity;

    address public voter;           // voter contract to vote on plugins
    address public mutlicall;       // multicall contract to get buy quotes   
    address public voteDelegate;    // address to delegate voting power to
    address public rewardReceiver;  // address to receive voting rewards

    // vote state
    address[] public plugins;       // plugins voted on
    uint256[] public weights;       // vote weight on plugins

    /*----------  ERRORS ------------------------------------------------*/

    error Manager__InvalidZeroInput();
    error Manager__InvalidZeroAddress();
    error Manager__NotVoteDelegate();
    error Manager__InvalidLength();

    /*----------  EVENTS ------------------------------------------------*/

    event Manager__VoterSet(address indexed account);
    event Manager__VoteDelegateSet(address indexed account);
    event Manager__RewardReceiverSet(address indexed account);
    event Manager__Fees(address indexed account, uint256 amount);
    event Manager__Claim(address indexed account, uint256 amount);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert Manager__InvalidZeroInput();
        _;
    }

    modifier nonZeroAddress(address _account) {
        if (_account == address(0)) revert Manager__InvalidZeroAddress();
        _;
    }

    modifier onlyVoteDelegate(address _account) {
        if (_account != voteDelegate) revert Manager__NotVoteDelegate();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    /**
     * @notice constructs a new Manager contract
     * @param _base the base token address
     * @param _token the token address
     * @param _oToken the oToken address
     * @param _vToken the vToken address
     * @param _vTokenRewarder the vTokenRewarder address
     */
    constructor(
        address _lsToken,
        address _base,
        address _token,
        address _oToken,
        address _vToken,
        address _vTokenRewarder,
        address _voter,
        address _mutlicall
    ) {
        lsToken = _lsToken;
        base = _base;
        token = _token;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        mutlicall = _mutlicall;
        voteDelegate = msg.sender;
        rewardReceiver = msg.sender;
        liquidity = address(new ManagerLiquidity(_base));
    }

    /**
     * @notice comit to stored vote to voter contract, can be called once an epoch
     */
    function vote() 
        external
    {
        IVoter(voter).vote(plugins, weights);
    }

    /**
     * @notice claim bribes from voter contract
     * @param bribes to claim
     */
    function claimBribes(address[] memory bribes) 
        external
    {
        IVoter(voter).claimBribes(bribes);
    }

    /**
     * @notice sweep tokens to rewardReceiver, will not sweep base, token, oToken, vToken
     * @param tokens to sweep to rewardReceiver
     */
    function sweepRewards(address[] calldata tokens)
        external
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != base && tokens[i] != token && tokens[i] != oToken && tokens[i] != vToken) {
                IERC20(tokens[i]).safeTransfer(rewardReceiver, IERC20(tokens[i]).balanceOf(address(this)));
            }
        }
    }

    /**
     * @notice claim rewards from vTokenRewarder (base, token, oToken)
     */
    function claimVTokenRewards() 
        public
    {
        IVTOKENRewarder(vTokenRewarder).getReward(address(this));
    }

    function burnOTokenForVToken() 
        public
    {
        uint256 balance = IERC20(oToken).balanceOf(address(this));
        if (balance > 0) {
            IERC20(oToken).safeApprove(vToken, 0);
            IERC20(oToken).safeApprove(vToken, balance);
            IVTOKEN(vToken).burnFor(address(this), balance);
        }
    }

    function stakeTokenForVToken() 
        public
    {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeApprove(vToken, 0);
            IERC20(token).safeApprove(vToken, balance);
            IVTOKEN(vToken).deposit(balance);
        }
    }
    
    function borrowMaxBase() 
        public
    {
        uint256 credit = ITOKEN(token).getAccountCredit(address(this));
        if (credit > 0) ITOKEN(token).borrow(credit);
    }

    function buyTokenWithBase(uint256 amount) 
        external
        nonZeroInput(amount)
    {
        uint256 holderFee = amount * feeToHolders / DIVISOR;
        if (holderFee > 0) IERC20(base).transfer(lsToken, holderFee);
        uint256 liquidityFee = amount * feeToLiquidity / DIVISOR;
        if (liquidityFee > 0) IERC20(base).transfer(liquidity, liquidityFee);
        amount = amount - holderFee - liquidityFee;

        IERC20(base).safeApprove(token, 0);
        IERC20(base).safeApprove(token, amount);
        (,,uint256 minOutput,) = IMulticall(mutlicall).quoteBuyIn(amount, SLIPPAGE_TOLERANCE);
        ITOKEN(token).buy(amount, minOutput, block.timestamp + 1800, address(this), address(this));
    }

    function buyTokenWithMaxBase() 
        public
    {
        uint256 balance = IERC20(base).balanceOf(address(this));
        if (balance > 0) {
            uint256 holderFee = balance * feeToHolders / DIVISOR;
            if (holderFee > 0) IERC20(base).transfer(lsToken, holderFee);
            uint256 liquidityFee = balance * feeToLiquidity / DIVISOR;
            if (liquidityFee > 0) IERC20(base).transfer(liquidity, liquidityFee);
            balance = balance - holderFee - liquidityFee;

            IERC20(base).safeApprove(token, 0);
            IERC20(base).safeApprove(token, balance);
            (,,, uint256 autoMinOutput) = IMulticall(mutlicall).quoteBuyIn(balance, SLIPPAGE_TOLERANCE);
            ITOKEN(token).buy(balance, autoMinOutput, block.timestamp + 1800, address(this), address(this));
        }
    }

    function loop(uint256 loops) external {
        for (uint256 i = 0; i < loops; i++) {
            claimVTokenRewards();
            burnOTokenForVToken();
            stakeTokenForVToken();
            borrowMaxBase();
            buyTokenWithMaxBase();
        }
    }

    /*----------  FUNCTION OVERRIDES  -----------------------------------*/

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setVotes(address[] calldata _plugins, uint256[] calldata _weights) 
        external 
        onlyVoteDelegate(msg.sender) 
    {
        if (_plugins.length != _weights.length) revert Manager__InvalidLength();
        plugins = _plugins;
        weights = _weights;
    }

    function setVoter(address _voter) 
        external 
        onlyOwner 
        nonZeroAddress(_voter)
    {
        voter = _voter;
        emit Manager__VoterSet(_voter);
    }

    function setVoteDelegate(address _voteDelegate) 
        external 
        onlyOwner 
        nonZeroAddress(_voteDelegate)
    {
        voteDelegate = _voteDelegate;
        emit Manager__VoteDelegateSet(_voteDelegate);
    }

    function setRewardReceiver(address _rewardReceiver) 
        external 
        onlyOwner 
        nonZeroAddress(_rewardReceiver)
    {
        rewardReceiver = _rewardReceiver;
        emit Manager__RewardReceiverSet(_rewardReceiver);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getVote() external view returns (address[] memory, uint256[] memory) {
        return (plugins, weights);
    }

}