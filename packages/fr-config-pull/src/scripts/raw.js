const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const path = require("path");
const { saveJsonToFile, escapePlaceholders } = utils;
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const _ = require("lodash");

const RAW_SUBDIR = "raw";

async function exportRawConfig(
  exportDir,
  tenantUrl,
  requestedConfigPath,
  requestedPushApiVersion,
  rawConfigFile,
  token
) {
  var rawConfigs = null;
  if (requestedConfigPath) {
    var config = { path: requestedConfigPath };
    if (requestedPushApiVersion) {
      config.pushApiVersion = requestedPushApiVersion;
    }
    rawConfigs = [config];
  } else if (rawConfigFile) {
    try {
      rawConfigs = JSON.parse(fs.readFileSync(rawConfigFile, "utf8"));
    } catch (e) {
      console.error("Error reading file", rawConfigFile);
      process.exit(1);
    }
  } else {
    console.error("Either specify --path option or configure RAW_CONFIG");
    process.exit(1);
  }

  try {
    for (var rawConfig of rawConfigs) {
      var urlPath = rawConfig.path;
      if (!urlPath.startsWith("/")) {
        urlPath = `/${urlPath}`;
      }

      const endpoint = `${tenantUrl}${urlPath}`;

      const response = await restGet(endpoint, null, token);

      let config = escapePlaceholders(response.data);
      if (rawConfig.overrides) {
        config = _.merge(config, rawConfig.overrides);
      }

      if (rawConfig.pushApiVersion) {
        config._pushApiVersion = rawConfig.pushApiVersion;
      }

      const fullPath = `${exportDir}/${RAW_SUBDIR}${urlPath}.json`;
      var dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      saveJsonToFile(config, fullPath);
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

module.exports.exportRawConfig = exportRawConfig;
