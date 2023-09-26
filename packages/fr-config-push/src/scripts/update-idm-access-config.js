const fs = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");

const updateAccessConfig = async (argv, token) => {
  console.log("Updating IDM access config");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/access-config");
    if (!fs.existsSync(dir)) {
      console.log("Warning: no access-config config defined");
      return;
    }
    const fileContent = JSON.parse(
      await readFile(path.join(dir, "access.json"))
    );
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/access`;

    await restPut(requestUrl, fileContent, token);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateAccessConfig;
