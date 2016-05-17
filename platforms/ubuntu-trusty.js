var registry = require('../utils/platform-registry.js');
var shell = require('shelljs');
var urlparse = require('url-parse');
var defaultInitDir = '/opt/machinit';

function makeNetRC(domain, username, password) {
    if(shell.ls('~/.netrc').grep('no such').length == 0) {
        shell.mv('~/.netrc', '~/.old.netrc');
    }
    shell.exec('touch ~/.netrc');
    shell.exec('echo \'machine ' + domain + '\nlogin ' + username + '\npassword ' + password + '\' >> ~/.netrc');
    shell.exec('source ~/.netrc');
}

function restoreNetRC() {
    shell.rm('-rf', '~/.netrc');
    if(shell.ls('~/.old.netrc').grep('no such').length == 0) {
        shell.mv('~/.old.netrc', '~/.netrc');
        shell.exec('source ~/.netrc');
    }
}

function ensureGitRepo(repo, gitdir) {
    if(!shell.which('git')) {
        shell.exec('sudo apt-get install git -y -q');
    }
    var status = shell.exec('git --git-dir=' + gitdir + ' --work-tree=' + repo + ' status');
    var isGit = status.stdout.indexOf('branch') > -1
    if(!isGit) {
        shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree=' + repo + ' init');
    }
}

function ensureRemoteAdded(repo, gitdir, repourl) {
    ensureGitRepo(repo, gitdir);
    shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree=' + repo + ' remote remove origin');
    shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree=' + repo + ' remote add origin ' + repourl);
}

function check() {
    var result = shell.exec('sudo cat /etc/lsb-release').grep('trusty');
    return result.stdout.length > 5;
}

function updateSystem(data) {
    var repo = data.localrepo;
    var gitdir = repo + '/.git';
    var remote = data.remote;
    if(data.gitusername && data.gitpassword) {
        var host = parse(remote).host;
        makeNetRC(host, data.gitusername, data.gitpassword);
    }
    ensureRemoteAdded(repo, gitdir, remote);
    shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree=' + repo + ' reset HEAD --hard');
    shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree=' + repo + ' fetch origin');
    shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree=' + repo + ' pull origin');

    if(data.gitusername && data.gitpassword) {
        restoreNetRC();
    }

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
    shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree ' + repo + ' commit -a -m \'updated repository from system\'');
    ensureRemoteAdded(repo, gitdir, remote);
    shell.exec('sudo git --git-dir=' + gitdir + ' --work-tree ' + repo + ' push origin master');
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
