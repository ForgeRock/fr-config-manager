const path = require("path");
const { readFile } = require("fs/promises");
const { restPut } = require("../../../fr-config-common/src/restClient");
const fs = require("fs");

const updateUiConfig = async (argv, token) => {
  console.log("Updating UI config");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Combine managed object JSON files

    const dir = path.join(CONFIG_DIR, "/ui");

    if (!fs.existsSync(dir)) {
      console.log("Warning: no UI config defined");
      return;
    }
    const fileContent = JSON.parse(
      await readFile(path.join(dir, "ui-configuration.json"))
    );

    const requestUrl = `${TENANT_BASE_URL}/openidm/config/ui/configuration`;
    await restPut(requestUrl, fileContent, token);
    return Promise.resolve();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateUiConfig;
