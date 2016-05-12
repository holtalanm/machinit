var registry = require('../utils/platform-registry.js');
var shell = require('shelljs');

function checkIfXenial() {
    var result = shell.exec('cat /etc/lsb-release').grep('xenial');
    return result.stdout.length > 5;
}

module.exports = registry.register('Ubuntu-Xenial', checkIfXenial, [
    'Ubuntu 16.04',
    'Ubuntu16.04',
    'Ubuntu1604',
    'XenialUbuntu',
    'UbuntuXenial'
]);
