// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "contracts/interfaces/IVoter.sol";
import "contracts/interfaces/ITOKENFees.sol";
import "contracts/interfaces/IPlugin.sol";

contract Controller {

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;
    address public immutable fees;

    struct Plugin {
        uint256 index;
        address plugin;
        address underlying;
        address gauge;
        address bribe;
        bool isAlive;
        string symbol;
        string protocol;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter,
        address _fees
    ) {
        voter = _voter;
        fees = _fees;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getPluginInfo(uint256 index) public view returns (Plugin memory plugin) {
        plugin.index = index;
        plugin.plugin = IVoter(voter).plugins(index);
        plugin.underlying = IPlugin(plugin.plugin).getUnderlyingAddress();
        plugin.gauge = IVoter(voter).gauges(plugin.plugin);
        plugin.bribe = IVoter(voter).bribes(plugin.plugin);
        plugin.isAlive = IVoter(voter).isAlive(plugin.gauge);
        plugin.symbol = IPlugin(plugin.plugin).getUnderlyingSymbol();
        plugin.protocol = IPlugin(plugin.plugin).getProtocol();
    }

    function getPluginsInfo() external view returns (Plugin[] memory plugins) {
        plugins = new Plugin[](IVoter(voter).getPlugins().length);
        for (uint256 i = 0; i < IVoter(voter).getPlugins().length; i++) {
            plugins[i] = getPluginInfo(i);
        }
        return plugins;
    }

    function distributeToGauges() public {
        address[] memory plugins = IVoter(voter).getPlugins();
        for (uint256 i = 0; i < plugins.length; i++) {
            address gauge = IVoter(voter).gauges(plugins[i]);
            if (IVoter(voter).isAlive(gauge)) {
                IVoter(voter).distribute(gauge);
            }
        }
    }

    function distributeToBribes() public {
        address[] memory plugins = IVoter(voter).getPlugins();
        for (uint256 i = 0; i < plugins.length; i++) {
            if (IVoter(voter).isAlive(IVoter(voter).gauges(plugins[i]))) {
                IPlugin(plugins[i]).claimAndDistribute();
            }
        }
    }

    function distributeToStakers() public {
        ITOKENFees(fees).distribute();
    }

    function distribute() external {
        distributeToGauges();
        distributeToBribes();
        distributeToStakers();
    }

}