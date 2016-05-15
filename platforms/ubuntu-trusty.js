var registry = require('../utils/platform-registry.js');
var shell = require('shelljs');
var defaultInitDir = '/opt/machinit';

function ensureGitRepo(repo, gitdir) {
    if(!shell.which('git')) {
        shell.exec('apt-get install git');
    }
    var isGit = shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' status').grep('On branch').length > 5;
    if(!isGit) {
        shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' init');
    }
}

function check() {
    var result = shell.exec('cat /etc/lsb-release').grep('trusty');
    return result.stdout.length > 5;
}

function updateSystem(data) {

}

function updateRepo(data) {
    var repo = data.localrepo;
    var gitdir = repo + '/.git';
    for(var file in data.files) {
        var repopath = repo + '/' + file.repopath;
        var systempath = file.platforms[data.currentplatform].path;

        shell.cp('', systempath, repopath);
    }

    ensureGitRepo(repo, gitdir);
    shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' add --all');
    shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' commit -m \'updated repository from system\'');
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
    updateSystem: updateSystem,
    updateRepo: updateRepo
});
