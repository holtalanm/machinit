var shell = require('shelljs');
var urlparse = require('url-parse');
var simplegit = require('simple-git');
var sprintf = require("sprintf-js").sprintf,
    vsprintf = require("sprintf-js").vsprintf;
var fs = require('fs');

function ensureSudo() {
    shell.exec('sudo whoami >> /dev/null');
}

function ensureGitCryptInstalled() {
    return !!shell.which('git-crypt');
}

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

function logError(err, info) {
    if(!!info) {
        console.log(info);
    }
    console.log(err);
}

function updateSystem(data) {
    ensureSudo();
    var repo = data.localrepo;
    var remote = setGitAuthOnRemote(data, data.remote);
    var sg = simplegit();
    shell.exec('sudo rm -rf ' + repo);
    sg.clone(remote, repo, (err) => {
        if(err) return logError(err, 'error occurred while cloning remote:');
        if(data.encryption) {
            var gitCryptDetected = ensureGitCryptInstalled();
            if(!gitCryptDetected) {
                console.log('git-crypt is required for git repository encryption.  Please install it using instructions that can be found at https://github.com/AGWA/git-crypt');
                return;
            }
            if(!data.keypath) {
                console.log('attempting to update from encrypted repository.  Please specify a key path using --key');
                return;
            }
            shell.exec('cd ' + repo + ' && git-crypt unlock ' + data.keypath);
        }
        for(var i = 0; i < data.files.length; i++) {
            var file = data.files[i];
            var filename = file.name;
            var repopath = repo + '/' + file.repofolder;
            var systempath = file.platforms[data.currentplatform].path;
            var sudo = !!file.sudo;

            shell.mkdir('-p', systempath);
            if(sudo) shell.exec('sudo cp -rf ' + repopath + '/' + filename + ' ' + systempath + '/' + filename);
            else shell.exec('cp -rf ' + repopath + '/' + filename + ' ' + systempath + '/' + filename);
        }
        shell.exec('sudo rm -rf ' + repo);
    });

}

function updateRepo(data) {
    var repo = data.localrepo;
    var remote = setGitAuthOnRemote(data, data.remote);
    var sg = simplegit(repo);
    var encryptedfiles = [];
    for(var i = 0; i < data.files.length; i++) {
        var file = data.files[i];
        var filename = file.name;
        var repopath = repo + '/' + file.repofolder;
        var systempath = file.platforms[data.currentplatform].path + '/' + filename;
        var sudo = !!file.sudo;

        if(!!file.encryption) {
            var repolocal = file.repofolder + '/' + filename;
            if(!!file.directory) {
                repolocal += '/*';
            }
            encryptedfiles.push(repolocal);
        }

        shell.mkdir('-p', repopath);
        if(sudo) shell.exec('sudo cp -rf ' + systempath + ' ' + repopath + '/' + filename);
        else shell.cp('-rf', systempath, repopath + '/' + filename);
    }

    ensureGitRepo(sg, (err) => {
        if(err) return logError(err, 'error occurred while initializing git repo:');
        function performGitOps(postAdd) {
            sg.add('--all', (err, info) => {
                if(err) return logError(err, 'error occurred while adding files to repo:');
                sg.commit('Updated machinit repo', (err, info) => {
                    if(err) return logError(err, 'error occurred while committing to repo:');
                    if(!!postAdd) postAdd();
                    ensureRemoteAdded(sg, remote, (err) => {
                        if(err) return logError(err, 'error occurred while adding remote:');
                        sg.push(['-f', 'machinit', 'master'], (err, info) => {
                            if(err) return logError(err, 'error occurred while pushing to remote:');
                            shell.exec('sudo rm -rf ' + repo);
                        });
                    });
                });
            });
        }
        if(data.encryption) {
            var gitCryptDetected = ensureGitCryptInstalled();
            if(!gitCryptDetected) {
                console.log('git-crypt is required for git repository encryption.  Please install it using instructions that can be found at https://github.com/AGWA/git-crypt');
                return;
            }
            if(!data.keypath) {
                console.log('attempting to update from encrypted repository.  Please specify a key path using --key');
                return;
            }
            shell.exec('cd ' + repo + ' && git-crypt init');
            var gitattributeslinetemplate = '%s filter=git-crypt diff=git-crypt\n';
            var gitattributespath = repo + '/.gitattributes';
            var writeStream = fs.createWriteStream(gitattributespath);
            for(var i = 0; i < encryptedfiles.length; i++) {
                writeStream.write(sprintf(gitattributeslinetemplate, encryptedfiles[i]));
            }
            writeStream.close();
            sg.add('.gitattributes', (err, info) => {
                if(err) return logError(err, 'error occurred while adding gitattributes file:');
                sg.commit('Update gitattributes for encryption', (err, info) => {
                    if(err) return logError(err, 'error occurred while committing gitattributes file:');
                    performGitOps(() => {
                        shell.exec('cd ' + repo + ' && git-crypt export-key ' + data.keypath);
                        console.log('git-crypt encryption key exported to: ' + data.keypath);
                    });
                });
            });
        }
        else performGitOps();
    });
}

function installPackages(data) {
    ensureSudo();
    for(var i = 0; i < data.packages.length; i++) {
        var package = data.packages[i];
        var platformpackage = package.platforms[data.currentplatform];
        if(!platformpackage) {
            console.log('Skipping package: ' + package.name + '.  Platform not specified for package.');
            continue;
        }
        console.log('Installing package: ' + package.name);
        var commands = platformpackage.commands;
        var failed;
        for(var j = 0; j < commands.length; j++) {
            var command = commands[j];
            var commandresult = shell.exec(commands[j]);
            if(commandresult.stderr.toString().length > 0) {
                console.log('Error detected installing package.');
                console.log('Error: ' + commandresult.stderr.toString());
                failed = true;
            }
        }
        if(!failed) console.log('Package installed!');
        else console.log('Error(s) detected in package installation.  Package may not have been installed.');
    }
}

module.exports = {
    updateRepo: updateRepo,
    updateSystem: updateSystem,
    installPackages: installPackages
};
