const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateInternalRoles = async (argv, token) => {
  console.log("Updating internal roles");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

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
      delete roleObject._rev;
      if (
        roleObject.temporalConstraints &&
        roleObject.temporalConstraints.length === 0
      ) {
        delete roleObject.temporalConstraints;
      }

      console.log(`Updating role ${roleObject.name}`);
      const requestUrl = `${TENANT_BASE_URL}/openidm/internal/role/${roleObject._id}`;
      await fidcRequest(requestUrl, roleObject, token);
    }

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateInternalRoles;
