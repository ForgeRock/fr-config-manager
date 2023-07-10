const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateEmailProvider = async (argv, token) => {
  console.log("Updating email provider settings");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/email-provider");
    if (!fs.existsSync(dir)) {
      console.log("Warning: no email-provider config defined");
      return;
    }
    const fileContent = JSON.parse(
      fs.readFileSync(path.join(dir, "external.email.json"))
    );
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/external.email`;

    await fidcRequest(requestUrl, fileContent, token);

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateEmailProvider;
