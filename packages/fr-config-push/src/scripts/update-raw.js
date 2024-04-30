const path = require("path");
const fs = require("fs");
const { restPut } = require("../../../fr-config-common/src/restClient");
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

async function listFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true, recursive: true });

  const filesAndDirs = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        return listFiles(filePath); // Recursively list files
      } else {
        return filePath; // Return file path
      }
    })
  );

  return filesAndDirs.flat();
}

const updateRawConfig = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const requestedPath = argv[OPTION.PATH];

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

    const configFiles = await listFiles(baseDir);

    for (const configFile of configFiles) {
      const urlPath = configFile.slice(baseDir.length).replace(/.json$/, "");
      if (requestedPath && !urlPath.startsWith(requestedPath)) {
        continue;
      }
      console.log(urlPath);
      var config = fs.readFileSync(configFile, "utf8");
      var resolvedConfig = replaceEnvSpecificValues(config);

      var configObject = JSON.parse(resolvedConfig);
      var apiVersion = configObject._pushApiVersion;
      if (!apiVersion) {
        apiVersion = DEFAULT_API_VERSION;
      }
      apiVersionHeader = `protocol=${apiVersion.protocol}, resource=${apiVersion.resource}`;
      clearOperationalAttributes(configObject);

      const requestUrl = `${TENANT_BASE_URL}${urlPath}`;

      await restPut(requestUrl, configObject, token, apiVersionHeader);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateRawConfig;
