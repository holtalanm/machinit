var registry = require('../utils/platform-registry.js');
var ubuntuplatform = require('./ubuntu-platform.js');
var shell = require('shelljs');

function checkIfXenial() {
    var result = shell.exec('cat /etc/lsb-release').grep('xenial');
    return result.stdout.length > 5;
}

module.exports = registry.register({
    name: 'Ubuntu-Xenial',
    aliasArray: [
        'Ubuntu 16.04',
        'Ubuntu16.04',
        'Ubuntu1604',
        'XenialUbuntu',
        'UbuntuXenial',
        'Ubuntu Xenial'
    ],
    check: checkIfXenial,
    updateSystem: ubuntuplatform.updateSystem,
    updateRepo: ubuntuplatform.updateRepo,
    installPackages: ubuntuplatform.installPackages
});
