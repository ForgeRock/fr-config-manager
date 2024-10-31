const { readFile } = require("fs/promises");
const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");

const updateCookieDomains = async (argv, token) => {
  console.log("Updating cookie domains");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/cookie-domains");
    if (!fs.existsSync(dir)) {
      console.log("Warning: no CORS config defined");
      return;
    }
    const cookieDomainConfig = JSON.parse(
      await readFile(path.join(dir, "cookie-domains.json"))
    );
    const serviceUrl = `${TENANT_BASE_URL}/environment/cookie-domains`;

    await restPut(
      serviceUrl,
      cookieDomainConfig,
      token,
      "protocol=2.0,resource=1.0"
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateCookieDomains;
