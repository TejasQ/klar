module.exports = {
  getPath: (name, value) => {
    if (typeof value === "string") {
      return value;
    }
    if (!value.path) {
      throw new Error(
        `Invalid configuration object: Resource with name ${name} is an object without a "path" property. 
  Please double-check your configuration options and try again.
    
  More info: https://github.com/tejasq/klar`,
      );
    }
    return value.path;
  },

  getResolver: (name, value) => {
    if (typeof value === "string") {
      return false;
    }
    if (!value.resolve) {
      return false;
    }
    if (typeof value.resolve !== "function") {
      throw new Error(
        `Invalid configuration object: Resource with name ${name} has a resolve property that is not a function. 
  Please double-check your configuration options and try again.
    
  More info: https://github.com/tejasq/klar`,
      );
    }
    return value.resolve;
  },
};
