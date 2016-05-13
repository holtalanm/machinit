const registry = {};

function registerPlatform(platform) {
    if(!platform.name || !platform.aliasArray || !platform.check || !platform.updateSystem || !platform.updateRepo) {
        console.error('Invalid Platform: ' + platform);
        return;
    }
    platform.aliasArray.push(platform.name);
    registry[platform.name] = platform;
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
