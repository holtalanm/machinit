const clc = require('command-line-commands');
const autoload = require('auto-load');
const jsonfile = require('jsonfile');
const platforms = require('./utils/platform-registry.js');
autoload('./platforms');


const cli = clc([
    { name: 'platform' },
    {
        name: 'update-system',
        definitions: [
            { name: 'dir', type: String },
            { name: 'fp', type: String }
        ]
    },
    {
        name: 'update-repo',
        definitions: [
            { name: 'dir', type: String },
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
        case 'platform':
            console.log(platform.name);
            break;
        case 'update-repo':
            var dir = command.options.dir;
            var content = getFileContent(command.options.fp ? command.options.fp : dir + '/machinit.json', platform);
            if(content) {
                content.localrepo = dir;
                platform.updateRepo(content);
            }
            break;
        case 'update-system':
            var dir = command.options.dir;
            var content = getFileContent(command.options.fp ? command.options.fp : dir + '/machinit.json', platform);
            if(content) {
                content.localrepo = dir;
                platform.updateSystem(content);
            }
            break;
        default:
            console.log('Unknown command: ' + command.name);
            break;
    }
}
