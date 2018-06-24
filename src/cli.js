module.exports = {
  help: `klar reads responses from backend endpoints and generates strongly typed interface 
definitions that clearly describe the data returned. It outputs GraphQL Schemas,
TypeScript Definitions, and flow types.

Example Usage:

  $ klar https://my-backend.com/

  The URL is optional if a URL is specified in klar.config.js.
  More info in the README: https://github.com/tejasq/klar

CLI Options:

  --configFile, -c
  Path to an alternative config file. 
  Looks for klar.config.js at project root by default.

  --outDir, -o
  Send output interfaces to different directory.

  --graphql, -g
  Generate GraphQL schemas instead of TypeScript definitions.

  --flow, -f
  Generate flow types instead of TypeScript definitions.

  --prefix, -p
  This flag prefixes the names of recursively generated
  interfaces with the name of the root resource.

  More info in the README: https://github.com/tejasq/klar
`,
  options: {
    flags: {
      prefix: {
        type: "boolean",
        alias: "p",
      },
      outDir: {
        type: "string",
        alias: "o",
      },
      dataProp: {
        type: "boolean",
        alias: "d",
      },
      graphql: {
        type: "boolean",
        alias: "g",
      },
      configFile: {
        type: "string",
        alias: "c",
      },
      flow: {
        type: "boolean",
        alias: "f",
      },
    },
  },
};
