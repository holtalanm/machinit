function logHelp(command, args, example) {
    console.log('\t' + command.name + ': ' + command.desc + '\n');
    if(args.length > 0) {
        console.log('\targuments:\n');
        for(var i = 0; i < args.length; i++) {
            var arg = args[i];
            console.log('\t\t' + arg.name + ': ' + arg.desc + '\n');
        }
    }
    console.log('\n\t\texample: ' + example + '\n');
}

module.exports = {
    logHelp: logHelp
};
