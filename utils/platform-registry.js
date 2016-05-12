const registry = {};

function registerPlatform(name, checkFunction, initFunction, pushFunction, pullFunction, aliasArray) {
    aliasArray.push(name);
    registry[name] = {
        aliases: aliasArray,
        check: checkFunction,
        init: initFunction,
        push: pushFunction,
        pull: pullFunction
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
