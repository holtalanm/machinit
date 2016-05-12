const registry = {};

function registerPlatform(name, checkFunction, aliasArray) {
    registry[name] = {
        aliases: aliasArray,
        check: checkFunction
    };
}

function getPlatform() {
    for(var platformName in registry) {
        if(registry.hasOwnProperty(platformName)) {
            var platform = registry[platformName];
            var isPlatform = platform.check();
            if(isPlatform) {
                return platform;
            }
        }
    }
    return undefined;
}

module.exports = {
    register: registerPlatform,
    get: getPlatform
}
