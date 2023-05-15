const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateEmailProvider = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/email-provider");
    const fileContent = JSON.parse(
      await readFile(path.join(dir, "external.email.json"))
    );
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/external.email`;

    await fidcRequest(requestUrl, fileContent, token);

    console.log("IDM email provider configuration updated");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateEmailProvider;
