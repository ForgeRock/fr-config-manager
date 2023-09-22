const fs = require("fs");
const path = require("path");
const {
  restPut,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

async function mergeExistingObjects(newManagedObject, resourceUrl, token) {
  const result = await restGet(resourceUrl, null, token);
  const existingObjects = result.objects;

  const existingObjectIndex = existingObjects.findIndex((el) => {
    return el.name === newManagedObject.name;
  });

  if (existingObjectIndex >= 0) {
    existingObjects.splice(existingObjectIndex, 1);
  }

  existingObjects.push(newManagedObject);

  return existingObjects;
}

const updateManagedObjects = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  const SCRIPT_HOOKS = ["onStore", "onRetrieve", "onValidate"];

  const requestedObjectName = argv[OPTION.NAME];

  if (requestedObjectName) {
    console.log("Updating managed object", requestedObjectName);
  } else {
    console.log("Updating managed objects");
  }

  try {
    // Combine managed object JSON files
    const dir = path.join(CONFIG_DIR, "/managed-objects");
    if (!fs.existsSync(dir)) {
      console.log("Warning: no managed objects defined");
      return;
    }

    let mappings = [];
    const managedObjectPaths = fs
      .readdirSync(`${dir}`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(`${dir}`, dirent.name));

    let managedObjects = [];
    for (const managedObjectPath of managedObjectPaths) {
      const managedObjectName = path.parse(managedObjectPath).base;
      const managedObject = JSON.parse(
        fs.readFileSync(
          path.join(managedObjectPath, `${managedObjectName}.json`)
        )
      );

      if (requestedObjectName && requestedObjectName !== managedObjectName) {
        continue;
      }

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

    const requestUrl = `${TENANT_BASE_URL}/openidm/config/managed`;

    if (requestedObjectName) {
      managedObjects = await mergeExistingObjects(
        managedObjects[0],
        requestUrl,
        token
      );
    }

    // Update all managed objects

    const requestBody = {
      objects: managedObjects,
    };

    await restPut(requestUrl, requestBody, token);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateManagedObjects;
