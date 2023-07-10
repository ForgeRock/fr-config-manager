const fs = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateServices = async (argv, token) => {
  console.log("Updating realm config");
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    for (const realm of JSON.parse(REALMS)) {
      // Read JSON files
      const dir = path.join(CONFIG_DIR, `/realms/${realm}/realm-config`);
      if (!fs.existsSync(dir)) {
        console.log(`Warning: no realm-config config defined in realm ${realm}`);
        continue;
      }
      const configFiles = fs
        .readdirSync(dir)
        .filter((name) => path.extname(name) === ".json"); // Filter out any non JSON files
      // Map JSON file content to an array


      // Update each service
      await Promise.all(
        configFiles.map(async (configFile) => {
          const fileContent = JSON.parse(
            await readFile(path.join(dir, configFile))
          );

          const configFileName = path.parse(configFile).name;
          //remove _rev if present to prevent validation error
          delete fileContent._rev;

          const requestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/${configFileName}`;
          await fidcRequest(requestUrl, fileContent, token);
          return Promise.resolve();
        })
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateServices;
