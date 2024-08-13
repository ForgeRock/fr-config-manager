const path = require("path");
const fs = require("fs");
const { restUpsert } = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;
const DEFAULT_API_VERSION = {
  protocol: "2.0",
  resource: "1.0",
};
const {
  replaceEnvSpecificValues,
  clearOperationalAttributes,
} = require("../helpers/config-process");
const { clear } = require("console");
const {
  STDIN_OPTION,
  STDIN_OPTION_SHORT,
} = require("../../../fr-config-common/src/constants.js");
const { globSync } = require("glob");

async function uploadConfig(configJson, urlPath, token) {
  var resolvedConfigJson = replaceEnvSpecificValues(configJson);

  var configObject = null;
  try {
    var configObject = JSON.parse(resolvedConfigJson);
  } catch (e) {
    console.error("Error parsing config JSON for", urlPath);
    process.exit(1);
  }
  const { TENANT_BASE_URL } = process.env;
  var apiVersion = configObject._pushApiVersion;
  if (!apiVersion) {
    apiVersion = DEFAULT_API_VERSION;
  }
  apiVersionHeader = `protocol=${apiVersion.protocol},resource=${apiVersion.resource}`;
  clearOperationalAttributes(configObject);

  const requestUrl = `${TENANT_BASE_URL}${urlPath}`;

  await restUpsert(requestUrl, configObject, token, apiVersionHeader);
}

const updateRawConfig = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const requestedPath = argv[OPTION.PATH];
  const stdin =
    process.argv.includes(`--${STDIN_OPTION}`) ||
    process.argv.includes(`-${STDIN_OPTION_SHORT}`);

  if (stdin) {
    if (!requestedPath) {
      console.error("Path required for stdin processing");
      process.exit(1);
    }

    const config = fs.readFileSync(process.stdin.fd, "utf-8");
    await uploadConfig(config, requestedPath, token);
    return;
  }

  if (requestedPath) {
    console.log("Updating raw config under", requestedPath);
  } else {
    console.log("Updating raw config");
  }

  try {
    const baseDir = path.join(CONFIG_DIR, "raw");

    if (!fs.existsSync(baseDir)) {
      console.log("Warning: config dir", dir, "does not exist");
      return;
    }

    const configFiles = globSync(`${baseDir}/**/*.json`);

    for (const configFile of configFiles) {
      const urlPath = configFile.slice(baseDir.length).replace(/.json$/, "");
      if (requestedPath && !urlPath.startsWith(requestedPath)) {
        continue;
      }
      console.log(urlPath);
      var config = fs.readFileSync(configFile, "utf8");
      await uploadConfig(config, urlPath, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateRawConfig;
