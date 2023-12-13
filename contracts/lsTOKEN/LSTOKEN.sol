// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
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

contract LSTOKENFees {

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

contract LSTOKENLiquidity {

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

contract LSTOKEN is ERC20, ERC20Permit, ERC20Votes, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /*===================================================================*/
    /*===========================  SETTINGS  ============================*/


    uint256 public constant RATIO = 10000;                  // 10000 lsTOKEN = 1 TOKEN
    string internal constant NAME = 'LiquidStakedTOKEN';    // Name of LSTOKEN
    string internal constant SYMBOL = 'lsTOKEN';            // Symbol of LSTOKEN

    /*===========================  END SETTINGS  ========================*/
    /*===================================================================*/

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant SLIPPAGE_TOLERANCE = 9500; // 5% slippage tolerance

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public feeToHolders = 1000;    // fee to holders   (0 < feeToHolders < 2500)
    uint256 public feeToLiquidity = 1000;  // fee to liquidity (0 < feeToLiquidity < 2500)

    address public immutable base;
    address public immutable token;
    address public immutable oToken;
    address public immutable vToken;
    address public immutable vTokenRewarder;

    address public immutable fees;
    address public liquidity;

    address public voter;           // voter contract to vote on plugins
    address public mutlicall;       // multicall contract to get buy quotes   
    address public voteDelegate;    // address to delegate voting power to
    address public rewardReceiver;  // address to receive voting rewards

    // vote state
    address[] public plugins;       // plugins voted on
    uint256[] public weights;       // vote weight on plugins

    // fees state
    uint256 public paidBase;
    uint256 public indexBase;
    mapping(address => uint256) public supplyIndexBase;
    mapping(address => uint256) public claimableBase;

    /*----------  ERRORS ------------------------------------------------*/

    error LSTOKEN__InvalidZeroInput();
    error LSTOKEN__InvalidZeroAddress();
    error LSTOKEN__NotVoteDelegate();
    error LSTOKEN__InvalidLength();

    /*----------  EVENTS ------------------------------------------------*/

    event LSTOKEN__Minted(address indexed account, uint256 amount);
    event LSTOKEN__VoterSet(address indexed account);
    event LSTOKEN__VoteDelegateSet(address indexed account);
    event LSTOKEN__RewardReceiverSet(address indexed account);
    event LSTOKEN__Fees(address indexed account, uint256 amount);
    event LSTOKEN__Claim(address indexed account, uint256 amount);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert LSTOKEN__InvalidZeroInput();
        _;
    }

    modifier nonZeroAddress(address _account) {
        if (_account == address(0)) revert LSTOKEN__InvalidZeroAddress();
        _;
    }

    modifier onlyVoteDelegate(address _account) {
        if (_account != voteDelegate) revert LSTOKEN__NotVoteDelegate();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    /**
     * @notice constructs a new LSTOKEN contract
     * @param _base the base token address
     * @param _token the token address
     * @param _oToken the oToken address
     * @param _vToken the vToken address
     * @param _vTokenRewarder the vTokenRewarder address
     */
    constructor(
        address _base,
        address _token,
        address _oToken,
        address _vToken,
        address _vTokenRewarder,
        address _voter,
        address _mutlicall
    )
        ERC20(NAME, SYMBOL)
        ERC20Permit(NAME)
    {
        base = _base;
        token = _token;
        oToken = _oToken;
        vToken = _vToken;
        vTokenRewarder = _vTokenRewarder;
        voter = _voter;
        mutlicall = _mutlicall;
        voteDelegate = msg.sender;
        rewardReceiver = msg.sender;
        fees = address(new LSTOKENFees(_base));
        liquidity = address(new LSTOKENLiquidity(_base));
    }

    /**
     * @notice deposit TOKEN to mint LSTOKEN, irreversible
     * @param amount the amount of LSTOKEN to mint
     */
    function mint(uint256 amount) 
        external
        nonReentrant
        nonZeroInput(amount)
    {
        address account = msg.sender;
        _updateFor(account);
        _mint(account, amount * RATIO);
        emit LSTOKEN__Minted(account, amount * RATIO);

        IERC20(token).safeTransferFrom(account, address(this), amount);
    }

    function claimFees() 
        external 
        returns (uint256 claimed) 
    {
        _updateFor(msg.sender);
        claimed = claimableBase[msg.sender];
        if (claimed > 0) {
            claimableBase[msg.sender] = 0;
            LSTOKENFees(fees).claimFeesFor(msg.sender, claimed);
            emit LSTOKEN__Claim(msg.sender, claimed);
        }
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
        if (holderFee > 0) _updateBase(holderFee);
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
            if (holderFee > 0) _updateBase(holderFee);
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

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._beforeTokenTransfer(from, to, amount);
        _updateFor(from);
        _updateFor(to);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setVotes(address[] calldata _plugins, uint256[] calldata _weights) 
        external 
        onlyVoteDelegate(msg.sender) 
    {
        if (_plugins.length != _weights.length) revert LSTOKEN__InvalidLength();
        plugins = _plugins;
        weights = _weights;
    }

    function setVoter(address _voter) 
        external 
        onlyOwner 
        nonZeroAddress(_voter)
    {
        voter = _voter;
        emit LSTOKEN__VoterSet(_voter);
    }

    function setVoteDelegate(address _voteDelegate) 
        external 
        onlyOwner 
        nonZeroAddress(_voteDelegate)
    {
        voteDelegate = _voteDelegate;
        emit LSTOKEN__VoteDelegateSet(_voteDelegate);
    }

    function setRewardReceiver(address _rewardReceiver) 
        external 
        onlyOwner 
        nonZeroAddress(_rewardReceiver)
    {
        rewardReceiver = _rewardReceiver;
        emit LSTOKEN__RewardReceiverSet(_rewardReceiver);
    }

    function _updateBase(uint256 amount) internal {
        IERC20(base).transfer(fees, amount);
        paidBase += amount;
        uint256 _ratio = amount * 1e18 / totalSupply();
        if (_ratio > 0) {
            indexBase += _ratio;
        }
        emit LSTOKEN__Fees(msg.sender, amount);
    }

    function _updateFor(address recipient) internal {
        uint _supplied = balanceOf(recipient);
        if (_supplied > 0) {
            uint _supplyIndex = supplyIndexBase[recipient];
            uint _index = indexBase; 
            supplyIndexBase[recipient] = _index;
            uint _delta = _index - _supplyIndex;
            if (_delta > 0) {
                uint _share = _supplied * _delta / 1e18;
                claimableBase[recipient] += _share;
            }
        } else {
            supplyIndexBase[recipient] = indexBase; 
        }
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function leverage() external view returns (uint256) {
        return IERC20(vToken).balanceOf(address(this)) * 1e18 / totalSupply();
    }

    function getVote() external view returns (address[] memory, uint256[] memory) {
        return (plugins, weights);
    }

}