const fs = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateRealmConfig = async (argv, configName, token) => {
  console.log("Updating realm config", configName);
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    for (const realm of JSON.parse(REALMS)) {
      const configFileName = path.join(
        CONFIG_DIR,
        `/realms/${realm}/realm-config/${configName}.json`
      );

      if (!fs.existsSync(configFileName)) {
        console.log("Warning: config", configFileName, "not found");
        return;
      }

      const fileContent = JSON.parse(await readFile(configFileName));
      const requestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/${configName}`;

      await fidcRequest(requestUrl, fileContent, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateRealmConfig;
