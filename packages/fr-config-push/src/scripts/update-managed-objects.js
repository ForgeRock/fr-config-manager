const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateManagedObjects = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  const SCRIPT_HOOKS = ["onStore", "onRetrieve", "onValidate"];
  console.log("Updating Managed Objects");

  try {
    // Combine managed object JSON files
    const dir = path.join(CONFIG_DIR, "/managed-objects");

    let mappings = [];
    const managedObjectPaths = fs
      .readdirSync(`${dir}`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(`${dir}`, dirent.name));

    const managedObjects = [];
    for (const managedObjectPath of managedObjectPaths) {
      const managedObjectName = path.parse(managedObjectPath).base;
      const managedObject = JSON.parse(
        fs.readFileSync(
          path.join(managedObjectPath, `${managedObjectName}.json`)
        )
      );

      // Update the Event scripts if we have been supplied them in the config
      Object.entries(managedObject).forEach(([key, value]) => {
        if (value.type && value.type === "text/javascript" && value.file) {
          const scriptFilePath = `${managedObjectPath}/${managedObject.name}.${key}.js`;
          if (fs.existsSync(scriptFilePath)) {
            const source = fs.readFileSync(scriptFilePath, {
              encoding: "utf-8",
            });
            delete value.file;
            value.source = source;
          }
        }
      });
      //Update event hook scripts
      Object.entries(managedObject.schema.properties).forEach(
        ([key, value]) => {
          SCRIPT_HOOKS.forEach((hook) => {
            if (value.hasOwnProperty(hook) && value[hook].file) {
              const scriptFilePath = `${managedObjectPath}/${value[hook].file}`;
              if (fs.existsSync(scriptFilePath)) {
                const source = fs.readFileSync(scriptFilePath, {
                  encoding: "utf-8",
                });
                value[hook].source = source;
                delete value[hook].file;
              }
            }
          });
        }
      );

      managedObjects.push(managedObject);
    }

    // Update all managed objects
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/managed`;
    const requestBody = {
      objects: managedObjects,
    };

    await fidcRequest(requestUrl, requestBody, token);
    console.log("Managed objects updated");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateManagedObjects;
