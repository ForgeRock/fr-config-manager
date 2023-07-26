const path = require("path");
const fs = require("fs");
const { readFile } = require("fs/promises");
const fidcRequest = require("../helpers/fidc-request");

const updatePasswordPolicy = async (argv, token) => {
  console.log("Updating password policy");
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    const realms = JSON.parse(REALMS);
    // Combine managed object JSON files
    for (const realm of realms) {
      const dir = path.join(
        CONFIG_DIR,
        `/realms/${realm}/password-policy`);

      if (!fs.existsSync(dir)) {
        console.log("Warning: no password policy config defined");
        return;
      }

      const fileContent = JSON.parse(
        await readFile(
          path.join(
            dir,
            `${realm}_user-password-policy.json`
          )
        )
      );

      const requestUrl = `${TENANT_BASE_URL}/openidm/config/${fileContent._id}`;
      await fidcRequest(requestUrl, fileContent, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updatePasswordPolicy;
