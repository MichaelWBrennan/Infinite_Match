// Unity WebGL Framework
// This is a minimal framework file for Unity WebGL builds

var UnityFramework = {
    name: "UnityFramework",
    version: "1.0.0",
    initialize: function() {
        console.log("Unity Framework initialized");
        return Promise.resolve();
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnityFramework;
}
