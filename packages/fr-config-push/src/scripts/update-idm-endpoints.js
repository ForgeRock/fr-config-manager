const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const fileFilter = require("../helpers/file-filter");
const glob = require("glob");
const fs = require("fs");
const cliUtils = require("../helpers/cli-options");
const { request } = require("http");
const { OPTION } = cliUtils;

async function handleEndpoint(dir, endpoint, baseUrl, token) {
  const data = fs.readFileSync(`${dir}/${endpoint.file}`, "utf8");
  endpoint.source = data;
  delete endpoint.file;
  const requestUrl = `${baseUrl}/${endpoint._id}`;
  await fidcRequest(requestUrl, endpoint, token);
  console.log(`IDM endpoint updated: ${endpoint._id}`);
}

const updateIdmEndpoints = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR, filenameFilter } = process.env;

  const requestedEndpointName = argv[OPTION.NAME];

  if (requestedEndpointName) {
    console.log("Updating IDM endpoint", requestedEndpointName);
  } else {
    console.log("Updating IDM endpoints");
  }

  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/endpoints");
    const useFF = filenameFilter || argv[OPTION.FILENAME_FILTER];

    if (!fs.existsSync(dir)) {
      console.log("Warning: no IDM endpoints defined");
      return;
    }

    await glob("*/*.json", { cwd: dir }, async (error, endpoints) => {
      if (error) {
        throw error;
      }

      for (const fileContent of endpoints) {
        const endpoint = JSON.parse(
          fs.readFileSync(path.join(dir, fileContent))
        );

        const endpointName = endpoint._id.split("/")[1];

        if (requestedEndpointName && requestedEndpointName !== endpointName) {
          continue;
        }

        if (!fileFilter(endpoint.file, useFF)) {
          continue;
        }

        const endpointDir = path.dirname(fileContent);
        await handleEndpoint(
          `${dir}/${endpointDir}`,
          endpoint,
          `${TENANT_BASE_URL}/openidm/config`,
          token
        );
      }
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateIdmEndpoints;
