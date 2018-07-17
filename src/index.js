#!/usr/bin/env node
const { existsSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { sync: pkgDir } = require("pkg-dir");
const async = require("async");
const fetch = require("node-fetch");
const babel = require("@babel/core");
const mkdirp = require("mkdirp");
const meow = require("meow");
const ora = require("ora");
const isOnline = require("is-online");

const cliConfig = require(resolve(__dirname, "./cli")); // eslint-disable-line import/no-dynamic-require
const { getPath, getResolver } = require(resolve(__dirname, "./util")); // eslint-disable-line import/no-dynamic-require
const transform = require(resolve(__dirname, "./transform")); // eslint-disable-line import/no-dynamic-require

const cli = meow(cliConfig.help, cliConfig.options);
const { prefix, outDir = ".", dataProp, graphql, flow, configFile } = cli.flags;
const configFileName = configFile || "klar.config.js";

const config = require(`${pkgDir(process.cwd())}/${configFileName}`); // eslint-disable-line import/no-dynamic-require
const configUrl = (cli.input[0] || config.url || "").replace(/\/$/, "");

const spinner = ora("Starting...").start();

const handleError = e => {
  spinner.fail(e);
  process.exit(1);
};

try {
  if (!existsSync(configFileName)) {
    throw new Error(
      `No config file found. 
  Please create a file at your project root called klar.config.js that specifies the resources you'd like to type, 
  along with any options you may have. 

  More info: https://github.com/tejasq/klar`,
    );
  }
  if (!config.resources || !Object.keys(config.resources).length) {
    throw new Error(
      `No resources specified in config file (${configFileName}) in the directory root.
  Please re-check your config file and try again. 

  More info: https://github.com/tejasq/klar`,
    );
  }
  if (!configUrl) {
    throw new Error(
      `No URL specified in config file (${configFileName}) in the directory root,
  or in a CLI flag.

  Please re-check your config file, or invoke klar with an argument
  specifying a URL like so:

    klar MY_HOST.com/api

  More info: https://github.com/tejasq/klar`,
    );
  }

  isOnline()
    .then(online => {
      if (!online) {
        throw new Error("No internet connection.");
      }
      spinner.succeed("Connected!");

      async.map(Object.entries(config.resources), resource => {
        const resourceName = resource[0];
        const resourceValue = resource[1];
        const path = getPath(resourceName, resourceValue);
        const resolver =
          getResolver(resourceName, resourceValue) ||
          config.resolve ||
          (dataProp ? response => response.data : response => response);
        const splitConfigUrl = configUrl.split("?");
        const host = splitConfigUrl[0];
        const queryString = splitConfigUrl[1] || "";
        const url = `${host}${path}${queryString}`;

        spinner.text = `Generating type definitions for ${resourceName}...`;
        fetch(url, config.request)
          .then(response => {
            if (!response.ok) {
              throw response;
            }
            return response.json();
          })
          .catch(response => {
            spinner.fail(
              `${resourceName}: Request failed with status ${response.status} ${
                response.statusText
              }.`,
            );
            return "REQUEST_FAILED";
          })
          .then(jsonResponse => {
            if (jsonResponse === "REQUEST_FAILED") {
              return;
            }
            mkdirp(outDir, error => {
              if (error) {
                throw new Error(error);
              }
              try {
                const transformedResponse = babel
                  .transform(`(${JSON.stringify(resolver(jsonResponse))})`, {
                    plugins: [
                      [
                        transform,
                        {
                          rootType: resourceName || "DEFAULT_TYPE",
                          prefix: prefix ? resourceName : "",
                          graphql,
                          flow,
                        },
                      ],
                    ],
                  })
                  .code.replace(/;/g, ""); // Remove semicolons after assignment expressions.

                const extension = (() => {
                  if (graphql) {
                    return ".graphql";
                  }
                  if (flow) {
                    return ".flow.js";
                  }
                  return ".d.ts";
                })();

                const destination = `${outDir}/${resourceName}${extension}`;
                writeFileSync(
                  resolve(destination),
                  flow
                    ? `// @flow\n\n${transformedResponse}`
                    : transformedResponse,
                );
                spinner.succeed(
                  `${resourceName}: Saved type definitions in ${destination}.`,
                );
              } catch (e) {
                spinner.fail(`${resourceName}: ${e}`);
              }
            });
            spinner.text = `Generating typedefs for ${resourceName}...`;
          })
          .catch(handleError);
      });
    })
    .catch(handleError);
} catch (e) {
  handleError(e);
}
