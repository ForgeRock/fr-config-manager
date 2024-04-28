const { readFile } = require("fs/promises");
const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const {
  ORG_PRIVILEGES_CONFIG,
} = require("../../../fr-config-common/src/constants");
const { OPTION } = require("../helpers/cli-options");

const updateOrgPrivileges = async (argv, token) => {
  const requestedConfigName = argv[OPTION.NAME];

  if (requestedConfigName) {
    if (!ORG_PRIVILEGES_CONFIG.includes(requestedConfigName)) {
      console.log("Error: unrecognised org config:", requestedConfigName);
      process.exit(1);
    }
    console.log("Updating org config", requestedConfigName);
  } else {
    console.log("Updating org config");
  }
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    var configFound = false;
    const dir = path.join(CONFIG_DIR, "org-privileges");
    if (!fs.existsSync(dir)) {
      console.log("Warning: no connectors in configuration");
    } else {
      const orgConfigs = fs
        .readdirSync(`${dir}`)
        .filter((name) => path.extname(name) === ".json")
        .map((filename) =>
          JSON.parse(fs.readFileSync(path.join(dir, filename)))
        );

      for (const orgConfig of orgConfigs) {
        const configName = orgConfig._id;
        if (requestedConfigName && requestedConfigName !== configName) {
          continue;
        }
        if (!ORG_PRIVILEGES_CONFIG.includes(configName)) {
          console.log("Warning: ignoring unrecognised config", configName);
          continue;
        }
        configFound = true;
        const requestUrl = `${TENANT_BASE_URL}/openidm/config/${configName}`;
        await restPut(requestUrl, orgConfig, token);
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (requestedConfigName && !configFound) {
    console.log(`Warning: org config ${requestedConfigName} not found`);
  }
};

module.exports = updateOrgPrivileges;
