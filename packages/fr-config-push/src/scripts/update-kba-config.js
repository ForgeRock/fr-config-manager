const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateAccessConfig = async (argv, token) => {
  console.log("updating KBA");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/kba");
    const fileContent = JSON.parse(
      await readFile(path.join(dir, "selfservice.kba.json"))
    );
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/selfservice.kba`;

    await fidcRequest(requestUrl, fileContent, token);

    console.log("KBA updated");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateAccessConfig;
