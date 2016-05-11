const clc = require('command-line-commands');
const platformutil = require('./utils/platform-util.js');


const cli = clc([
   { name: 'platform' }
]);

const command = cli.parse();

switch(command.name) {
    case 'platform':
        console.log(platformutil.platform.toString());
        break;
    default:
        console.log('Unknown command: ' + command.name);
        break;
}
