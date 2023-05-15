const fs = require("fs");
const { readFile } = require("fs/promises");
const { request } = require("http");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateSecretMappings = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    for (const realm of JSON.parse(REALMS)) {
      // Read JSON files
      const dir = path.join(CONFIG_DIR, `/realms/${realm}/secret-mappings`);
      if (!fs.existsSync(dir)) {
        continue;
      }

      const configFiles = fs
        .readdirSync(dir)
        .filter((name) => path.extname(name) === ".json"); // Filter out any non JSON files
      // Map JSON file content to an array

      // Update each mapping
      await Promise.all(
        configFiles.map(async (configFile) => {
          const fileContent = JSON.parse(
            await readFile(path.join(dir, configFile))
          );

          const mappingName = fileContent._id;
          //remove _rev if present to prevent validation error
          delete fileContent._rev;

          const requestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/secrets/stores/GoogleSecretManagerSecretStoreProvider/ESV/mappings/${mappingName}`;
          await fidcRequest(requestUrl, fileContent, token);
          console.log(
            `Secret mapping ${mappingName} updated in realm ${realm}`
          );
          return Promise.resolve();
        })
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateSecretMappings;
