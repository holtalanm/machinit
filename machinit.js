const clc = require('command-line-commands');
const platforms = require('./utils/platform-registry.js');
require('./platforms/ubuntu-xenial.js');


const cli = clc([
   { name: 'platform' }
]);

const command = cli.parse();


var platform = platforms.get();
switch(command.name) {
    case 'platform':
        console.log(platform ? platform : 'Your current platform is not supported by Machinit and is unknown.');
        break;
    default:
        console.log('Unknown command: ' + command.name);
        break;
}
