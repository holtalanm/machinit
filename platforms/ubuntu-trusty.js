var registry = require('../utils/platform-registry.js');
var shell = require('shelljs');
var defaultInitDir = '/opt/machinit';

function ensureGitRepo(repo, gitdir) {
    if(!shell.which('git')) {
        shell.exec('apt-get install git -y -q');
    }
    var status = shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' status');
    var isGit = status.stdout.indexOf('branch') > -1
    if(!isGit) {
        shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' init');
    }
}

function ensureRemoteAdded(repo, gitdir, repourl) {
    ensureGitRepo(repo, gitdir);
    if(!(shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' remote -v').grep(repourl))) {
        shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' remote add origin ' + repourl);
    }
}

function check() {
    var result = shell.exec('cat /etc/lsb-release').grep('trusty');
    return result.stdout.length > 5;
}

function updateSystem(data) {
    var repo = data.localrepo;
    var gitdir = repo + '/.git';
    var remote = data.remote;
    ensureRemoteAdded(repo, gitdir, remote);
    shell.exec('git --git-dir=' + gitdir + '--work-tree ' + repo + ' reset HEAD --hard');
    shell.exec('git --git-dir=' + gitdir + '--work-tree ' + repo + ' fetch all');
    shell.exec('git --git-dir=' + gitdir + '--work-tree ' + repo + ' pull origin');

    for(var i = 0; i < data.packages.length; i++) {
        var package = data.packages[i];
        var platformCommands = package.platforms[data.currentplatform].commands;
        for(var j = 0; j < platformCommands.length; j++) {
            var command = platformCommands[j];
            shell.exec(command);
        }
    }

    for(var i = 0; i < data.files.length; i++) {
        var file = data.files[i];
        var filename = file.name;
        var repopath = repo + '/' + file.repofolder;
        var systempath = file.platforms[data.currentplatform].path;

        shell.mkdir('-p', systempath);
        shell.cp('-rf', repopath + '/' + filename, systempath + '/' + filename);
    }
}

function updateRepo(data) {
    var repo = data.localrepo;
    var gitdir = repo + '/.git';
    var remote = data.remote;
    for(var i = 0; i < data.files.length; i++) {
        var file = data.files[i];
        var filename = file.name;
        var repopath = repo + '/' + file.repofolder;
        var systempath = file.platforms[data.currentplatform].path + '/' + filename;

        shell.mkdir('-p', repopath);
        shell.cp('-rf', systempath, repopath + '/' + filename);
    }

    ensureGitRepo(repo, gitdir);
    shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' commit -a -m \'updated repository from system\'');
    ensureRemoteAdded(repo, gitdir, remote);
    shell.exec('git --git-dir=' + gitdir + ' --work-tree ' + repo + ' push origin master');
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
