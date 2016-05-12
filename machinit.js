const clc = require('command-line-commands');
const platformutil = require('./utils/platform-util.js');
const platforms = require('./utils/platform-registry.js');
require('./platforms/ubuntu-xenial.js');


const cli = clc([
   { name: 'init', definitions: [ { name: 'dir', type: String } ] }
]);

const command = cli.parse();

switch(command.name) {
    case 'init':
        platforms.get().init(command.options.dir);
        break;
    default:
        console.log('Unknown command: ' + command.name);
        break;
}
