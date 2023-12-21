// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LsTokenFees {

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

contract LsToken is ERC20, ERC20Permit, ERC20Votes, ReentrancyGuard, Ownable  {
    using SafeERC20 for ERC20;

    /*===================================================================*/
    /*===========================  SETTINGS  ============================*/

    string internal constant NAME = 'LiquidStakedTOKEN';    // Name of LSTOKEN
    string internal constant SYMBOL = 'lsTOKEN';            // Symbol of LSTOKEN

    /*===========================  END SETTINGS  ========================*/
    /*===================================================================*/

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant EMISSION = 1048576 * 1e18;  // 1,048,576 tokens per day
    uint256 public constant EPOCH = 86400;              // 1 day
    uint256 public constant ERA = 1814400;              // 3 weeks per era
    uint256 public constant SPAN = 21;                  // 21 eras total

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public immutable genesis;   // genesis epoch time
    uint256 public immutable terminus;  // terminus epoch time
    address public immutable base;
    address public immutable fees;

    uint256 public totalContribution;
    address public treasury;

    mapping(uint256=>uint256) epoch_TotalBalance;                       // epoch -> total balance
    mapping(uint256=>mapping(address=>uint256)) epoch_Account_Balance;  // epoch -> account -> balance
    mapping(uint256=>mapping(address=>bool)) epoch_Account_Settled;     // epoch -> account -> settled  
    mapping(uint256=>uint256) epoch_TotalAccounts;                      // epoch -> total number of accounts contributed
    mapping(uint256=>address[]) epoch_Accounts;                         // epoch -> accounts[] with contributions
    mapping(address=>uint256) account_TotalEpochs;                      // account -> total number of epochs contributed to
    mapping(address=>uint256[]) account_Epochs;                         // account -> epochs[] contributed to

    // fees state
    uint256 public paidBase;
    uint256 public indexBase;
    mapping(address => uint256) public supplyIndexBase;
    mapping(address => uint256) public claimableBase;

    /*----------  ERRORS  -----------------------------------------------*/

    error LsToken__InvalidZeroInput();
    error LsToken__BeforeGenesis();
    error LsToken__AfterTerminus();
    error LsToken__AlreadySettled();
    error LsToken__EpochIncomplete();

    /*----------  EVENTS  -----------------------------------------------*/

    event LsToken__Contribution(address indexed account, uint256 indexed epoch, uint256 amount);
    event LsToken__Settlement(address indexed account, uint256 indexed epoch, uint256 amount);
    event LsToken__FeesUpdated(address indexed account, uint256 amount);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert LsToken__InvalidZeroInput();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(address _base) 
        ERC20(NAME, SYMBOL)
        ERC20Permit(NAME)
    {
        genesis = (block.timestamp / ERA) + ERA;
        terminus = genesis + (ERA * SPAN);
        base = _base;
        treasury = msg.sender;
        fees = address(new LsTokenFees(_base));
    }

    function contribute(address account, uint256 amount) 
        external
        nonReentrant 
        nonZeroInput(amount) 
    {
        uint256 epoch = getCurrentEpoch();
        if (epoch < genesis) revert LsToken__BeforeGenesis();
        if (epoch > terminus) revert LsToken__AfterTerminus();

        if (epoch_Account_Balance[epoch][account] == 0) {
            epoch_TotalAccounts[epoch] += 1;
            epoch_Accounts[epoch].push(account);
            account_TotalEpochs[account] += 1;
            account_Epochs[account].push(epoch);
        }
        epoch_Account_Balance[epoch][account] += amount;
        epoch_TotalBalance[epoch] += amount;
        totalContribution += amount;
        emit LsToken__Contribution(account, epoch, amount);
        IERC20(base).transferFrom(msg.sender, treasury, amount);
    }

    function settle(address account, uint256 timestamp) nonReentrant external {
        uint256 epoch = getEpoch(timestamp);
        if (epoch < genesis) revert LsToken__BeforeGenesis();
        if (epoch > terminus) revert LsToken__AfterTerminus();
        if (epoch >= getCurrentEpoch()) revert LsToken__EpochIncomplete(); 
        if (epoch_Account_Settled[epoch][account]) revert LsToken__AlreadySettled();
        
        uint256 emission = EMISSION / (2 ** getEra(epoch));
        uint256 amount = (epoch_Account_Balance[epoch][account] * emission) / epoch_TotalBalance[epoch];
        epoch_Account_Settled[epoch][account] = true;
        emit LsToken__Settlement(account, epoch, amount);
        _mint(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function _updateBase(uint256 amount) internal {
        IERC20(base).transfer(fees, amount);
        paidBase += amount;
        uint256 _ratio = amount * 1e18 / totalSupply();
        if (_ratio > 0) {
            indexBase += _ratio;
        }
        emit LsToken__FeesUpdated(msg.sender, amount);
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

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getEpoch(uint256 timestamp) public view returns (uint256) {
        return (timestamp / EPOCH) * EPOCH;
    }

    function getEra(uint256 timestamp) public view returns (uint256) {
        return (timestamp - genesis) / ERA;
    }

    function getCurrentEpoch() public view returns (uint256) {
        return getEpoch(block.timestamp);
    }

    function getCurrentEra() public view returns (uint256) {
        return getEra(block.timestamp);
    }
    
}