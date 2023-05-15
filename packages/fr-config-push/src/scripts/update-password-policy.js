const path = require("path");
const { readFile } = require("fs/promises");
const fidcRequest = require("../helpers/fidc-request");

const updatePasswordPolicy = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    const realms = JSON.parse(REALMS);
    // Combine managed object JSON files
    for (const realm of realms) {
      const fileContent = JSON.parse(
        await readFile(
          path.join(
            CONFIG_DIR,
            `/realms/${realm}/password-policy/${realm}_user-password-policy.json`
          )
        )
      );

      const requestUrl = `${TENANT_BASE_URL}/openidm/config/${fileContent._id}`;
      await fidcRequest(requestUrl, fileContent, token);
      console.log(`${realm} user password policy updated`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updatePasswordPolicy;
