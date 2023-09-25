const fs = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");

const updateRealmConfig = async (argv, configName, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    for (const realm of JSON.parse(REALMS)) {
      console.log(`Updating ${configName} config for realm ${realm}`);
      const configFileName = path.join(
        CONFIG_DIR,
        `/realms/${realm}/realm-config/${configName}.json`
      );

      if (!fs.existsSync(configFileName)) {
        console.log("Warning: config", configFileName, "not found");
        return;
      }

      const fileContent = JSON.parse(await readFile(configFileName));
      delete fileContent._rev;
      const requestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/${configName}`;

      await restPut(
        requestUrl,
        fileContent,
        token,
        "protocol=1.0,resource=1.0"
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateRealmConfig;
