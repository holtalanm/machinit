const clc = require('command-line-commands');
const autoload = require('auto-load');
const jsonfile = require('jsonfile');
const platforms = require('./utils/platform-registry.js');
autoload('./platforms');


const cli = clc([
    { name: 'help' },
    { name: 'platform' },
    {
        name: 'update-system',
        definitions: [
            { name: 'dir', type: String },
            { name: 'gituser', type: String },
            { name: 'gitpw', type: String },
            { name: 'fp', type: String }
        ]
    },
    {
        name: 'update-repo',
        definitions: [
            { name: 'dir', type: String },
            { name: 'gituser', type: String },
            { name: 'gitpw', type: String },
            { name: 'fp', type: String }
        ]
    }
]);

const command = cli.parse();

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

var platform = platforms.get();
if(!platform) {
    console.log('Your current platform is not supported by Machinit.');
} else {
    switch(command.name) {
        case 'help':
            console.log('Machinit.  The simple way of syncing files between your machines using git.');
            console.log('commands:');
            console.log('\thelp:  (ex. "machinit help") lists out the information about the commands and what they do.');
            console.log('\tplatform: (ex. "machinit platform") prints out the current plaform\'s name, also checks if the current platform is supported');
            console.log('\tupdate-repo: (ex. "machinit update-repo --dir /opt/machinit/is/awesome") updates the given directory by reading the file called machinit.json within the given directroy');
            console.log('\t\toptions:');
            console.log('\t\t\tdir: the directory path for the repository (required)');
            console.log('\t\t\tfp: the file path for the json file to read.  If not specified, looks for machinit.json within the repository directory.  (optional)');
            console.log('\tupdate-system: (ex. "machinit update-system --dir /opt/machinit/is/awesome") updates the current system by reading the file called machinit.json within the given directroy');
            console.log('\t\toptions:');
            console.log('\t\t\tdir: the directory path for the repository (required)');
            console.log('\t\t\tfp: the file path for the json file to read.  If not specified, looks for machinit.json within the repository directory.  (optional)');
            break;
        case 'platform':
            console.log(platform.name);
            break;
        case 'update-repo':
            var dir = command.options.dir;
            var gituser = command.options.gituser;
            var gitpw = command.options.gitpw;
            var content = getFileContent(command.options.fp ? command.options.fp : dir + '/machinit.json', platform);
            if(content) {
                content.localrepo = dir;
                content.gitusername = gituser;
                content.gitpassword = gitpw;
                platform.updateRepo(content);
            }
            break;
        case 'update-system':
            var dir = command.options.dir;
            var gituser = command.options.gituser;
            var gitpw = command.options.gitpw;
            var content = getFileContent(command.options.fp ? command.options.fp : dir + '/machinit.json', platform);
            if(content) {
                content.localrepo = dir;
                content.gitusername = gituser;
                content.gitpassword = gitpw;
                platform.updateSystem(content);
            }
            break;
        default:
            console.log('Unknown command: ' + command.name);
            break;
    }
}
