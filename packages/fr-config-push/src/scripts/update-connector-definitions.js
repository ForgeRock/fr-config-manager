const path = require("path");
const fs = require("fs");
const fidcRequest = require("../helpers/fidc-request");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const updateConnectorDefinitions = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const connectorName = argv[OPTION.NAME];

  if (connectorName) {
    console.log("Updating connector", connectorName);
  } else {
    console.log("Updating connectors");
  }

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
        if (connectorName && connectorName !== connectorFile._id) {
          continue;
        }
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
