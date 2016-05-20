var registry = require('../utils/platform-registry.js');
var ubuntuplatform = require('./ubuntu-platform.js');
var shell = require('shelljs');

function check() {
    var result = shell.exec('cat /etc/lsb-release').grep('trusty');
    return result.stdout.length > 5;
}

module.exports = registry.register({
    name: 'Ubuntu-Trusty',
    aliasArray: [
        'Ubuntu 14.04',
        'Ubuntu14.04',
        'Ubuntu1404',
        'TrustyUbuntu',
        'UbuntuTrusty',
        'Ubuntu Trusty'
    ],
    check: check,
    updateSystem: ubuntuplatform.updateSystem,
    updateRepo: ubuntuplatform.updateRepo
});
