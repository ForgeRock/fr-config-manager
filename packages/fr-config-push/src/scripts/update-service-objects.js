const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const {
  replaceEnvSpecificValues,
  removeProperty,
} = require("../helpers/config-process");

const updateServiceObjects = async (argv, token) => {
  console.log("Updating IDM service objects");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    const baseDir = path.join(CONFIG_DIR, `/service-objects`);
    if (!fs.existsSync(baseDir)) {
      console.log("Warning: no service objects defined");
      return;
    }

    const objectTypes = fs.readdirSync(baseDir);
    for (const objectType of objectTypes) {
      const subDir = path.join(baseDir, objectType);

      const objectFiles = fs
        .readdirSync(subDir)
        .filter((name) => path.extname(name) === ".json");

      for (const objectFile of objectFiles) {
        var objectFileContents = fs.readFileSync(
          path.join(subDir, objectFile),
          "utf8"
        );
        var resolvedobjectFileContents = replaceEnvSpecificValues(
          objectFileContents,
          false
        );
        const objectAttributes = JSON.parse(resolvedobjectFileContents);

        delete objectAttributes._rev;
        removeProperty(objectAttributes, "_refProperties");

        const resourceUrl = `${TENANT_BASE_URL}/openidm/managed/${objectType}/${objectAttributes._id}`;
        await fidcRequest(`${resourceUrl}`, objectAttributes, token);
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateServiceObjects;
