// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ACTOKEN is ERC20, ReentrancyGuard  {
    using SafeERC20 for ERC20;

    uint256 public constant EMISSION = 1048576; 
    uint256 public constant EPOCH = 86400;      // 1 day
    uint256 public constant ERA = 1814400;      // 3 weeks per era
    uint256 public constant SPAN = 21;          // 21 eras total

    uint256 public immutable genesis;   // genesis epoch time
    uint256 public immutable terminus;  // terminus epoch time
    address public immutable base;

    uint256 public totalContribution;
    address public treasury;

    mapping(uint256=>uint256) epoch_TotalUnits;                         // epoch -> total units
    mapping(uint256=>mapping(address=>uint256)) epoch_Account_Units;    // epoch -> account -> units

    mapping(uint256=>uint256) epoch_TotalAccounts;  // epoch -> total number of accounts
    mapping(uint256=>address[]) epoch_Accounts;     // epoch -> accounts[]

    mapping(address=>uint256) account_TotalEpochs; // account -> total numner of epochs
    mapping(address=>uint256[]) account_Epochs;     // account -> epochs[]

    error ACTOKEN__InvalidZeroInput();
    error ACTOKEN__BeforeGenesis();
    error ACTOKEN__AfterTerminus();

    event ACTOKEN__Contribution(address indexed account, uint256 indexed epoch, uint256 amount);

    constructor(address _base) 
        ERC20("acTOKEN", "TOKEN Accumulator")
    {
        genesis = (block.timestamp / ERA) + ERA;
        terminus = genesis + (ERA * SPAN);
        base = _base;
        treasury = msg.sender;
    }

    function getCurrentEpoch() public view returns (uint256) {
        return (block.timestamp / EPOCH) * EPOCH;
    }

    function getCurrentEra() public view returns (uint256) {
        return (block.timestamp - genesis) / ERA;
    }

    function contribute(address account, uint256 amount) nonReentrant external {
        if (amount == 0) revert ACTOKEN__InvalidZeroInput();
        if (block.timestamp < genesis) revert ACTOKEN__BeforeGenesis();
        if (block.timestamp > terminus) revert ACTOKEN__AfterTerminus();
        uint256 epoch = getCurrentEpoch();
        if (epoch_Account_Units[epoch][account] == 0) {
            epoch_TotalAccounts[epoch] += 1;
            epoch_Accounts[epoch].push(account);
            account_TotalEpochs[account] += 1;
            account_Epochs[account].push(epoch);
        }
        epoch_Account_Units[epoch][account] += amount;
        epoch_TotalUnits[epoch] += amount;
        totalContribution += amount;
        emit ACTOKEN__Contribution(account, epoch, amount);
        IERC20(base).transferFrom(msg.sender, treasury, amount);
    }
    
}