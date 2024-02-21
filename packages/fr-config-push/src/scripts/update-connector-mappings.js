const path = require("path");
const fs = require("fs");
const {
  restPut,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

async function mergeExistingMappings(newMapping, resourceUrl, token) {
  const result = await restGet(resourceUrl, null, token);
  const existingMappings = result.data.mappings;

  const existingMappingIndex = existingMappings.findIndex((el) => {
    return el.name === newMapping.name;
  });

  if (existingMappingIndex >= 0) {
    existingMappings.splice(existingMappingIndex, 1);
  }

  existingMappings.push(newMapping);

  return existingMappings;
}

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
        for (const eventName of [
          "onCreate",
          "onUpdate",
          "onDelete",
          "onLink",
          "onUnlink",
          "validSource",
          "validTarget",
        ]) {
          const eventTrigger = mappingObject[eventName];
          if (!eventTrigger || !eventTrigger.file) {
            continue;
          }

          const fileEventScript = path.join(mappingPath, eventTrigger.file);

          if (fs.existsSync(fileEventScript)) {
            mappingObject[eventName].source = fs.readFileSync(fileEventScript, {
              encoding: "utf8",
            });
            if (!mappingObject[eventName].type) {
              mappingObject[eventName].type = "text/javascript";
            }
            delete mappingObject[eventName].file;
          }
        }

        mappings.push(mappingObject);
      }

      if (requestedMappingName) {
        mappings = await mergeExistingMappings(mappings[0], requestUrl, token);
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
