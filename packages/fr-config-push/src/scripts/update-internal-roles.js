const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const updateInternalRoles = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const requestedRoleName = argv[OPTION.NAME];

  if (requestedRoleName) {
    console.log("Updating internal role", requestedRoleName);
  } else {
    console.log("Updating internal roles");
  }

  try {
    // Combine internal roles JSON files
    const dir = path.join(CONFIG_DIR, "/internal-roles");

    if (!fs.existsSync(dir)) {
      console.log("Warning: no internal roles defined");
      return;
    }

    const internalRolesFiles = fs
      .readdirSync(dir)
      .filter((name) => path.extname(name) === ".json");

    for (const internalRolesFile of internalRolesFiles) {
      var internalRolesFileContent = fs.readFileSync(
        path.join(dir, internalRolesFile),
        "utf8"
      );

      let roleObject = JSON.parse(internalRolesFileContent);

      if (requestedRoleName && requestedRoleName !== roleObject.name) {
        continue;
      }

      delete roleObject._rev;
      if (
        roleObject.temporalConstraints &&
        roleObject.temporalConstraints.length === 0
      ) {
        delete roleObject.temporalConstraints;
      }

      console.log(`Updating role ${roleObject.name}`);
      const requestUrl = `${TENANT_BASE_URL}/openidm/internal/role/${roleObject._id}`;
      await restPut(requestUrl, roleObject, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateInternalRoles;
