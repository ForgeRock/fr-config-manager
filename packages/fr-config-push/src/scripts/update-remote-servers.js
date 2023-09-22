const path = require("path");
const { readFile } = require("fs/promises");
const { restPut } = require("../../../fr-config-common/src/restClient");
const { existsSync } = require("fs");

const updateRemoteServers = async (argv, token) => {
  console.log("Updating Remote Connector Servers");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  const dir = path.join(CONFIG_DIR, "/sync/rcs");

  const configFile = path.join(
    dir,
    "provisioner.openicf.connectorinfoprovider.json"
  );
  if (existsSync(configFile)) {
    try {
      const fileContent = JSON.parse(await readFile(configFile));

      const requestUrl = `${TENANT_BASE_URL}/openidm/config/provisioner.openicf.connectorinfoprovider`;

      await restPut(requestUrl, fileContent, token);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  } else {
    console.log("Warning: No RCS config file found");
  }
};

module.exports = updateRemoteServers;
