const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateAccessConfig = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/access-config");
    const fileContent = JSON.parse(
      await readFile(path.join(dir, "access.json"))
    );
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/access`;

    await fidcRequest(requestUrl, fileContent, token);

    console.log("IDM access configuration updated");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateAccessConfig;
