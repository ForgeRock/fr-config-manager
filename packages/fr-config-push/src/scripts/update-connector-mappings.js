const path = require("path");
const fs = require("fs");
const { restPut } = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const updateConnectorMappings = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  const requestedMappingName = argv[OPTION.NAME];

  if (requestedMappingName) {
    console.log("Updating mapping", requestedMappingName);
  } else {
    console.log("Updating mappings");
  }

  try {
    const dir = path.join(CONFIG_DIR, "/sync/mappings");
    if (fs.existsSync(dir)) {
      let mappings = [];
      const mappingPaths = fs
        .readdirSync(`${dir}`, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => path.join(`${dir}`, dirent.name));
      const requestUrl = `${TENANT_BASE_URL}/openidm/config/sync`;

      for (const mappingPath of mappingPaths) {
        const mappingname = path.parse(mappingPath).base;
        if (requestedMappingName && requestedMappingName !== mappingname) {
          continue;
        }

        const mappingObject = JSON.parse(
          fs.readFileSync(path.join(mappingPath, `${mappingname}.json`))
        );
        // Update the Event scripts if we have been supplied them in the config
        for (const eventName of ["onCreate", "onUpdate", "onError"]) {
          const eventScriptName = mappingObject.name + "_" + eventName + ".js";

          const fileEventScript = path.join(
            CONFIG_DIR,
            "sync/mappings/event-scripts/" + eventScriptName
          );
          if (fs.existsSync(fileEventScript)) {
            if (!mappingObject[eventName]) {
              mappingObject[eventName] = {};
            }
            mappingObject[eventName].source = fs.readFileSync(fileEventScript, {
              encoding: "utf8",
            });
            if (!mappingObject[eventName].type) {
              mappingObject[eventName].type = "text/javascript";
            }
          }
        }

        // Update the Properties Transform scripts if we have been supplied them in the config

        if (mappingObject.name && mappingObject.properties) {
          for (const property of mappingObject.properties) {
            if (property.target && property.transform) {
              const propertyTransformScript = path.join(
                CONFIG_DIR,
                "/connectors/mappings/properties-transform-scripts/" +
                  mappingObject.name +
                  "/" +
                  property.target +
                  ".js"
              );
              if (fs.existsSync(propertyTransformScript)) {
                property.transform.source = fs.readFileSync(
                  propertyTransformScript,
                  { encoding: "utf8" }
                );
                if (!property.transform.type) {
                  property.transform.type = "text/javascript";
                }
              }
            }
          }
        }
        mappings.push(mappingObject);
      }
      const requestBody = {
        mappings: mappings,
      };

      await restPut(requestUrl, requestBody, token);
    } else {
      console.log("Warning: No Connector mappings");
    }
    return Promise.resolve();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateConnectorMappings;
