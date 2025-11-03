const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const path = require("path");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { property, pull } = require("lodash");
const { saveJsonToFile } = utils;

const EXPORT_SUBDIR = "managed-objects";
const SCRIPT_HOOKS = ["onStore", "onRetrieve", "onValidate"];

let repoMapping = null;

async function getRepoMapping(tenantUrl, token) {
  if (repoMapping) {
    return repoMapping;
  }

  const configUrl = `${tenantUrl}/openidm/config/repo.ds`;
  const response = await restGet(configUrl, null, token);
  repoMapping = response.data;
  return repoMapping;
}

async function getCustomRelationships(managedObject, tenantUrl, token) {
  const mapping = await getRepoMapping(tenantUrl, token);
  let customRelationships = [];
  const objectMapping =
    mapping.resourceMapping.genericMapping[`managed/${managedObject.name}`];

  if (!objectMapping) {
    return customRelationships;
  }

  for (const [name, property] of Object.entries(
    managedObject.schema.properties
  )) {
    const mappingProperty = objectMapping.properties[name];
    if (
      mappingProperty &&
      mappingProperty.type === "reference" &&
      mappingProperty.ldapAttribute.startsWith("fr-idm-reference-")
    ) {
      customRelationships.push(name);
    }
  }
  return customRelationships;
}

// Split managed.json into separate objects, each with separate scripts

async function processManagedObjects(
  managedObjects,
  targetDir,
  name,
  pullCustomRelationships,
  tenantUrl,
  token
) {
  //console.log("managed objects", JSON.stringify(managedObjects, null, 2));
  try {
    for (const managedObject of managedObjects) {
      if (name && name !== managedObject.name) {
        return;
      }

      const objectPath = path.join(targetDir, managedObject.name);

      if (!fs.existsSync(objectPath)) {
        fs.mkdirSync(objectPath, { recursive: true });
      }

      Object.entries(managedObject).forEach(([key, value]) => {
        if (value.type && value.type === "text/javascript" && value.source) {
          const scriptFilename = `${managedObject.name}.${key}.js`;
          value.file = scriptFilename;
          fs.writeFileSync(path.join(objectPath, scriptFilename), value.source);
          delete value.source;
        }
      });

      if (managedObject.actions) {
        Object.entries(managedObject.actions).forEach(([key, value]) => {
          if (value.type && value.type === "text/javascript" && value.source) {
            const scriptFilename = `${managedObject.name}.actions.${key}.js`;
            value.file = scriptFilename;
            fs.writeFileSync(
              path.join(objectPath, scriptFilename),
              value.source
            );
            delete value.source;
          }
        });
      }

      for (const [key, value] of Object.entries(
        managedObject.schema.properties
      )) {
        SCRIPT_HOOKS.forEach((hook) => {
          if (
            value.hasOwnProperty(hook) &&
            value[hook].type === "text/javascript" &&
            value[hook].source
          ) {
            const scriptFilename = `${managedObject.name}.${key}.${hook}.js`;
            value[hook].file = scriptFilename;
            fs.writeFileSync(
              path.join(objectPath, scriptFilename),
              value[hook].source
            );
            delete value[hook].source;
          }
        });
      }

      if (pullCustomRelationships) {
        const customRelationships = await getCustomRelationships(
          managedObject,
          tenantUrl,
          token
        );

        for (const customRelationship of customRelationships) {
          const schemaPath = path.join(objectPath, "schema");
          if (!fs.existsSync(schemaPath)) {
            fs.mkdirSync(schemaPath, { recursive: true });
          }
          const schemaUrl = `${tenantUrl}/openidm/schema/managed/${managedObject.name}/properties/${customRelationship}`;
          const schemaResponse = await restGet(schemaUrl, null, token);
          saveJsonToFile(
            schemaResponse.data,
            path.join(
              schemaPath,
              `${managedObject.name}.schema.${customRelationship}.json`
            )
          );
        }
      }

      const fileName = path.join(objectPath, `${managedObject.name}.json`);
      saveJsonToFile(managedObject, fileName);
    }
  } catch (err) {
    console.error(err);
  }
}

async function exportManagedObjects(
  exportDir,
  tenantUrl,
  name,
  pullCustomRelationships,
  token
) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/managed`;

    const response = await restGet(idmEndpoint, null, token);

    const managedObjects = response.data.objects;

    const fileDir = path.join(exportDir, EXPORT_SUBDIR);
    await processManagedObjects(
      managedObjects,
      fileDir,
      name,
      pullCustomRelationships,
      tenantUrl,
      token
    );
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportManagedObjects = exportManagedObjects;
