const { readFile } = require("fs/promises");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const fs = require("fs");

const updateAudit = async (argv, token) => {
  console.log("Updating audit config");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    const dir = path.join(CONFIG_DIR, "/audit");

    if (!fs.existsSync(dir)) {
      console.log("Warning: no audit config defined");
      return;
    }

    const fileContent = JSON.parse(
      await readFile(path.join(dir, "audit.json"))
    );
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/audit`;

    await restPut(requestUrl, fileContent, token);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateAudit;
