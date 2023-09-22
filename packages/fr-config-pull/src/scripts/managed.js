const utils = require("../helpers/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;

const EXPORT_SUBDIR = "managed-objects";
const SCRIPT_HOOKS = ["onStore", "onRetrieve", "onValidate"];

// Split managed.json into separate objects, each with separate scripts

function processManagedObjects(managedObjects, targetDir, name) {
  try {
    managedObjects.forEach((managedObject) => {
      if (name && name !== managedObject.name) {
        return;
      }

      const objectPath = `${targetDir}/${managedObject.name}`;

      if (!fs.existsSync(objectPath)) {
        fs.mkdirSync(objectPath, { recursive: true });
      }

      Object.entries(managedObject).forEach(([key, value]) => {
        if (value.type && value.type === "text/javascript" && value.source) {
          const scriptFilename = `${managedObject.name}.${key}.js`;
          value.file = scriptFilename;
          fs.writeFileSync(`${objectPath}/${scriptFilename}`, value.source);
          delete value.source;
        }
      });

      Object.entries(managedObject.schema.properties).forEach(
        ([key, value]) => {
          SCRIPT_HOOKS.forEach((hook) => {
            if (
              value.hasOwnProperty(hook) &&
              value[hook].type === "text/javascript" &&
              value[hook].source
            ) {
              const scriptFilename = `${managedObject.name}.${key}.${hook}.js`;
              value[hook].file = scriptFilename;
              fs.writeFileSync(
                `${objectPath}/${scriptFilename}`,
                value[hook].source
              );
              delete value[hook].source;
            }
          });
        }
      );

      const fileName = `${objectPath}/${managedObject.name}.json`;
      saveJsonToFile(managedObject, fileName);
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportManagedObjects(exportDir, tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/managed`;

    const response = await restGet(idmEndpoint, null, token);

    const managedObjects = response.data.objects;

    const fileDir = `${exportDir}/${EXPORT_SUBDIR}`;
    processManagedObjects(managedObjects, fileDir, name);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportManagedObjects = exportManagedObjects;
