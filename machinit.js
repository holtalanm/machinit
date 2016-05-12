const clc = require('command-line-commands');
const platformutil = require('./utils/platform-util.js');
const platforms = require('./utils/platform-registry.js');
require('./platforms/ubuntu-xenial.js');


const cli = clc([
   { name: 'platform' }
]);

const command = cli.parse();

switch(command.name) {
    case 'platform':
        console.log(platforms.get());
        break;
    default:
        console.log('Unknown command: ' + command.name);
        break;
}
