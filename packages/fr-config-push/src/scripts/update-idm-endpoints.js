const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const fileFilter = require("../helpers/file-filter");
const { globSync } = require("glob");
const fs = require("fs");
const cliUtils = require("../helpers/cli-options");
const { request } = require("http");
const { OPTION } = cliUtils;

async function handleEndpoint(dir, endpoint, baseUrl, token) {
  const data = fs.readFileSync(`${dir}/${endpoint.file}`, "utf8");
  endpoint.source = data;
  delete endpoint.file;
  const requestUrl = `${baseUrl}/${endpoint._id}`;
  await restPut(requestUrl, endpoint, token);
  console.log(`Endpoint updated: ${endpoint._id}`);
}

const updateIdmEndpoints = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR, filenameFilter } = process.env;

  const requestedEndpointName = argv[OPTION.NAME];

  if (requestedEndpointName) {
    console.log("Updating endpoint", requestedEndpointName);
  } else {
    console.log("Updating endpoints");
  }

  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/endpoints");
    const useFF = filenameFilter || argv[OPTION.FILENAME_FILTER];

    if (!fs.existsSync(dir)) {
      console.log("Warning: no endpoints defined");
      return;
    }

    const endpointJsonFiles = globSync("*/*.json", { cwd: dir });
    var endpointFound = false;

    for (const endpointJsonFile of endpointJsonFiles) {
      const endpoint = JSON.parse(
        fs.readFileSync(path.join(dir, endpointJsonFile))
      );

      const endpointName = endpoint._id.split("/")[1];

      if (requestedEndpointName && requestedEndpointName !== endpointName) {
        continue;
      }

      endpointFound = true;

      if (!fileFilter(endpoint.file, useFF)) {
        continue;
      }

      const endpointDir = path.dirname(endpointJsonFile);
      await handleEndpoint(
        `${dir}/${endpointDir}`,
        endpoint,
        `${TENANT_BASE_URL}/openidm/config`,
        token
      );
    }

    if (requestedEndpointName && !endpointFound) {
      console.error(`Endpoint not found: ${requestedEndpointName}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateIdmEndpoints;
