const path = require("path");
const { readFile } = require("fs/promises");
const fidcRequest = require("../helpers/fidc-request");

const updateUiConfig = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Combine managed object JSON files

    const dir = path.join(CONFIG_DIR, "/ui");

    const fileContent = JSON.parse(
      await readFile(path.join(dir, "ui-configuration.json"))
    );

    const requestUrl = `${TENANT_BASE_URL}/openidm/config/ui/configuration`;
    await fidcRequest(requestUrl, fileContent, token);
    console.log("UI config updated");
    return Promise.resolve();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateUiConfig;
