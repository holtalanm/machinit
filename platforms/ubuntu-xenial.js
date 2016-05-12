var registry = require('../utils/platform-registry.js');
var shell = require('shelljs');
var defaultInitDir = '/opt/machinit';

function checkIfXenial() {
    var result = shell.exec('cat /etc/lsb-release').grep('xenial');
    return result.stdout.length > 5;
}

function cdToDir(dir) {
    var result = shell.cd(dir);
    if(result.grep('no such').stderr.length > 5) {
        result = shell.mkdir('-p', dir);
    }
    shell.cd(dir);
    return result;
}

function ensureGitInstalled() {
    if(!(shell.which('git').stdout.length > 2)) {
        shell.exec('apt-get install git -y -q');
    }
}

function isInGitRepo() {
    ensureGitInstalled();
    var result = shell.exec('git status');
    return !(result.stderr);
}

function init(initDir) {
    if(!initDir) initDir = defaultInitDir;
    var result = cdToDir(initDir);
    if(!isInGitRepo()) {
        result = result.exec('git init');
    } else {
        console.log('Already a git repository initialized within directory: ' + initDir + '. If you wish to specify a different directory, please call init with -dir option');
    }
}

function push(initDir) {
    if(!initDir) initDir = defaultInitDir;
    var result = cdToDir(initDir);
    ensureGitInstalled();
    return shell.exec('git push origin master')
}

function pull(initDir) {
    if(!initDir) initDir = defaultInitDir;
    var result = cdToDir(initDir);
    ensureGitInstalled();
    return shell.exec('git pull origin master')
}

module.exports = registry.register('Ubuntu-Xenial', checkIfXenial, init, push, pull, [
    'Ubuntu 16.04',
    'Ubuntu16.04',
    'Ubuntu1604',
    'XenialUbuntu',
    'UbuntuXenial'
]);
