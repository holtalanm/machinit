var registry = require('../utils/platform-registry.js');
var shell = require('shelljs');
var urlparse = require('url-parse');
var simplegit = require('simple-git');

function ensureGitRepo(sg, cb) {
    if(!shell.which('git')) {
        return cb("Machinit requires git to work. Please install git before running Machinit.");
    }
    return sg.status((err, data) => {
        if(err) {
            if(err.toString().toLowerCase().indexOf('not a git') > -1) {
                data = err;
            }
            else return cb(err);
        }
        if(data.toString().toLowerCase().indexOf('not a git') > -1) {
            sg.init(false, (err, data) => {
                if(err) return cb(err);
                return cb(null);
            });
        } else return cb(null);
    });
}

function ensureRemoteAdded(sg, repourl, cb) {
    ensureRemoteRemoved(sg, (err) => {
        if(err) return cb(err);
        sg.addRemote('machinit', repourl, (err, data) => {
            if(err) return cb(err);
            return cb(null);
        });
    });
}

function ensureRemoteRemoved(sg, cb) {
    ensureGitRepo(sg, (err) => {
        if(err) return cb(err);
        sg.removeRemote('machinit', (err, data) => {
            if(err) {
                if(!(err.toString().toLowerCase().indexOf('could not remove') > -1)) {
                    return cb(err);
                }
            }
            return cb(null);
        });
    });
}

function check() {
    var result = shell.exec('cat /etc/lsb-release').grep('trusty');
    return result.stdout.length > 5;
}

function setGitAuthOnRemote(data, remote) {
    if(data.gitusername && data.gitpassword) {
        var parsedremote = urlparse(remote);
        parsedremote.set('username', encodeURIComponent(data.gitusername));
        parsedremote.set('password', encodeURIComponent(data.gitpassword));
        remote = parsedremote.toString();
        console.log(remote);
    }
    return remote;
}

function updateSystem(data) {
    var repo = data.localrepo;
    var remote = setGitAuthOnRemote(data, data.remote);
    var sg = simplegit(repo);
    ensureRemoteAdded(sg, remote, (err) => {
        if(err) return console.log(err);
        sg.fetch('machinit', 'master', (err, data) => {
            if(err) return console.log(err);
            sg.pull('machinit', 'master', (err, data) => {
                if(err) return console.log(err);
                ensureRemoteRemoved(sg, (err) => {
                    if(err) return console.log(err);

                    for(var i = 0; i < data.files.length; i++) {
                        var file = data.files[i];
                        var filename = file.name;
                        var repopath = repo + '/' + file.repofolder;
                        var systempath = file.platforms[data.currentplatform].path;

                        shell.mkdir('-p', systempath);
                        shell.cp('-rf', repopath + '/' + filename, systempath + '/' + filename);
                    }
                });
            });

        });

    });
}

function updateRepo(data) {
    var repo = data.localrepo;
    var remote = setGitAuthOnRemote(data, data.remote);
    var sg = simplegit(repo);
    for(var i = 0; i < data.files.length; i++) {
        var file = data.files[i];
        var filename = file.name;
        var repopath = repo + '/' + file.repofolder;
        var systempath = file.platforms[data.currentplatform].path + '/' + filename;

        shell.mkdir('-p', repopath);
        shell.cp('-rf', systempath, repopath + '/' + filename);
    }

    ensureGitRepo(sg, (err) => {
        if(err) return console.log(err);
        sg.add('--all', (err, data) => {
            if(err) return console.log(err);
            sg.commit('Updated machinit repo', (err, data) => {
                if(err) return console.log(err);
                ensureRemoteAdded(sg, remote, (err) => {
                    if(err) return console.log(err);
                    sg.push('machinit', 'master', (err, data) => {
                        if(err) return console.log(err);
                        ensureRemoteRemoved(sg, (err) => {
                            if(err) return console.log(err);
                        });
                    });
                });
            });
        });
    });
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
