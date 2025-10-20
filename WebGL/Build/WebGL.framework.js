// Unity WebGL Framework
// This is a minimal framework implementation for Unity WebGL builds

var UnityFramework = {
  version: "1.0.0",
  initialized: false,
  
  init: function() {
    this.initialized = true;
    console.log("Unity Framework initialized");
  },
  
  isInitialized: function() {
    return this.initialized;
  }
};

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnityFramework;
} else {
  window.UnityFramework = UnityFramework;
}