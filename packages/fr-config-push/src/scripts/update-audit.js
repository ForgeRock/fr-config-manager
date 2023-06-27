const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateAudit = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    const dir = path.join(CONFIG_DIR, "/audit");
    const fileContent = JSON.parse(
      await readFile(path.join(dir, "audit.json"))
    );
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/audit`;

    await fidcRequest(requestUrl, fileContent, token);

    console.log("IDM audit configuration updated");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateAudit;
