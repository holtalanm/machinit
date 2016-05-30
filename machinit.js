const clc = require('command-line-commands');
require('require-all')(__dirname + '/platforms');
const jsonfile = require('jsonfile');
const platforms = require('./utils/platform-registry.js');
const cmdutil = require('./utils/commandutil.js');

const cli = clc([
    { name: 'help' },
    { name: 'platform' },
    {
        name: 'update-system',
        definitions: [
            { name: 'dir', type: String },
            { name: 'gituser', type: String },
            { name: 'gitpw', type: String },
            { name: 'fp', type: String },
            { name: 'key', type: String }
        ]
    },
    {
        name: 'update-repo',
        definitions: [
            { name: 'dir', type: String },
            { name: 'gituser', type: String },
            { name: 'gitpw', type: String },
            { name: 'fp', type: String },
            { name: 'key', type: String }
        ]
    },
    {
        name: 'install-packages',
        definitions: [
            { name: 'fp', type: String }
        ]
    }
]);

function getFileContent(filepath, platform) {
    var content = jsonfile.readFileSync(filepath);
    var supported = false;
    for(var i = 0; i < content.platforms.length; i++) {
        var p = content.platforms[i];
        var usedAliases = platform.aliasArray.filter((alias) => {
            return p == alias;
        });
        supported = usedAliases.length > 0;
        if(supported) {
            content.currentplatform = p;
            break;
        }
    }
    if(!supported) {
        console.log('Your current platform is not supported by the given file/repository: ' + platform.name);
        return null;
    } else {
        return content;
    }
}

function runCommand() {
    const command = cli.parse();
    var platform = platforms.get();
    if(!platform) {
        console.log('Your current platform is not supported by Machinit.');
    } else {
        switch(command.name) {
            case 'help':
                var updateargs = [{
                    name: 'dir',
                    desc: 'the directory path for the repository'
                }, {
                    name: 'gituser',
                    desc: 'the git username for the remote repository'
                }, {
                    name: 'gitpw',
                    desc: 'the git password for the remote repository'
                }, {
                    name: 'fp',
                    desc: 'the file path for the json file containing the machinit configuration for this command'
                }, {
                    name: 'key',
                    desc: 'the file path for the exported encryption key used for decrypting any files that were specified for encryption'
                }];
                console.log('Machinit.  The simple way of syncing files between your machines using git.');
                console.log('commands:');
                cmdutil.logHelp({
                    name: 'help',
                    desc: 'lists out the information about the commands and what they do.'
                }, [], 'machinit help');
                cmdutil.logHelp({
                    name: 'platform',
                    desc: 'prints out the current platform\'s name. Also checks if the current planform is supported.'
                }, [], 'machinit platform');
                cmdutil.logHelp({
                    name: 'update-repo',
                    desc: 'updates the given directory by reading the file from the given file path.  Will init git repository to the directory given. Directory will be removed after update`'
                }, updateargs, 'machinit update-repo --dir /opt/machinit/is/awesome --gituser machinit --gitpw isawesome --fp /opt/machinit.json --key /opt/machinit-key');
                cmdutil.logHelp({
                    name: 'update-system',
                    desc: 'updates the current system by reading the given json file.  Will clone a git repository at the given directory.  Directory will be removed after update.'
                }, updateargs, 'machinit update-system --dir /opt/machinit/is/awesome --gituser machinit --gitpw isawesome --fp /opt/machinit.json --key /opt/machinit-key');
                cmdutil.logHelp({
                    name: 'install-packages',
                    desc: 'installs packages specified from within the given json file.'
                }, [{
                    name: 'fp',
                    desc: 'the file path for the json file to be read containing package information'
                }], 'machinit install-packages --fp /opt/machinit.json');
                break;
            case 'platform':
                console.log(platform.name);
                break;
            case 'update-repo':
                var dir = command.options.dir;
                var gituser = command.options.gituser;
                var gitpw = command.options.gitpw;
                var keypath = command.options.key;
                var content = getFileContent(command.options.fp ? command.options.fp : dir + '/machinit.json', platform);
                if(content) {
                    content.localrepo = dir;
                    content.gitusername = gituser;
                    content.gitpassword = gitpw;
                    content.keypath = keypath;
                    platform.updateRepo(content);
                }
                break;
            case 'update-system':
                var dir = command.options.dir;
                var gituser = command.options.gituser;
                var gitpw = command.options.gitpw;
                var keypath = command.options.key;
                var content = getFileContent(command.options.fp ? command.options.fp : dir + '/machinit.json', platform);
                if(content) {
                    content.localrepo = dir;
                    content.gitusername = gituser;
                    content.gitpassword = gitpw;
                    content.keypath = keypath;
                    platform.updateSystem(content);
                }
                break;
            case 'install-packages':
                var fp = command.options.fp;
                if(!fp){
                    console.log('file path must be specified with --fp');
                    break;
                }
                var content = getFileContent(fp, platform);
                if(content) {
                    platform.installPackages(content);
                }
                break;
            default:
                console.log('Unknown command: ' + command.name);
                break;
        }
    }
}

module.exports = {
    machinit: runCommand
};
