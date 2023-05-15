const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const fileFilter = require("../helpers/file-filter");
const glob = require("glob");
const { readFileSync } = require("fs");

async function handleEndpoint(dir, endpoint, baseUrl, token) {
  const data = readFileSync(`${dir}/${endpoint.file}`, "utf8");
  endpoint.source = data;
  delete endpoint.file;
  const requestUrl = `${baseUrl}/${endpoint._id}`;
  await fidcRequest(requestUrl, endpoint, token);
  console.log(`IDM endpoint updated: ${endpoint._id}`);
}
const updateScripts = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR, filenameFilter } = process.env;

  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/endpoints");
    const useFF = filenameFilter || argv.filenameFilter;
    console.log("updating endpoints");
    await glob("*/*.json", { cwd: dir }, async (error, endpoints) => {
      if (error) {
        throw error;
      }
      for (const fileContent of endpoints) {
        const endpoint = JSON.parse(
          await readFile(path.join(dir, fileContent))
        );
        if (!fileFilter(endpoint.file, useFF)) {
          return;
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

module.exports = updateScripts;
