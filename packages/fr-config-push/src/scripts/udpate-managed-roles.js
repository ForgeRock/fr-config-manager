const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateManagedRoles = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    const { realm } = argv;

    // Combine managed object JSON files
    const dir = path.join(CONFIG_DIR, `/realms/${realm}/managed-roles`);

    const managedRolesFileContent = fs
      .readdirSync(dir)
      .filter((name) => path.extname(name) === ".json") // Filter out any non JSON files
      .map((filename) => require(path.join(dir, filename))); // Map JSON file content to an array

    await Promise.all(
      managedRolesFileContent.map(async (managedRoleFile) => {
        const requestUrl = `${TENANT_BASE_URL}/openidm/managed/${realm}_user/${managedRoleFile._id}`;
        await fidcRequest(requestUrl, managedRoleFile, token);
        console.log(`${realm} role, ${managedRoleFile.name} updated`);

        return Promise.resolve();
      })
    );
    console.log("Managed roles updated");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateManagedRoles;
