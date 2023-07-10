const path = require("path");
const fs = require("fs");
const fidcRequest = require("../helpers/fidc-request");

const updateConnectorDefinitions = async (argv, token) => {
  console.log("Updating connectors");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    const dir = path.join(CONFIG_DIR, "sync/connectors");
    if (fs.existsSync(dir)) {
      const connectorFileContent = fs
        .readdirSync(`${dir}`)
        .filter((name) => path.extname(name) === ".json")
        .map((filename) =>
          JSON.parse(fs.readFileSync(path.join(dir, filename)))
        );

      for (const connectorFile of connectorFileContent) {
        const requestUrl = `${TENANT_BASE_URL}/openidm/config/${connectorFile._id}`;
        await fidcRequest(requestUrl, connectorFile, token);
        console.log(`${connectorFile._id} updated`);
      }
    } else {
      console.log("Warning: no connectors in configuration");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateConnectorDefinitions;
