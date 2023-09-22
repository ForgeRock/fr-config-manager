const { existsSync } = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");

const updateConfigMetadata = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    if (argv.metadata) {
      console.log("Updating config metadata");
      const requestUrl = `${TENANT_BASE_URL}/openidm/config/custom-config.metadata`;
      await restPut(requestUrl, argv.metadata, token);
    } else {
      console.log("No config metadata provided");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateConfigMetadata;
