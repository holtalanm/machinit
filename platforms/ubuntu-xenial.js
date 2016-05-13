var registry = require('../utils/platform-registry.js');
var shell = require('shelljs');
var defaultInitDir = '/opt/machinit';

function checkIfXenial() {
    var result = shell.exec('cat /etc/lsb-release').grep('xenial');
    return result.stdout.length > 5;
}

function updateSystem(data) {

}

function updateRepo(data) {

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
    updateSystem: updateSystem,
    updateRepo: updateRepo
});
