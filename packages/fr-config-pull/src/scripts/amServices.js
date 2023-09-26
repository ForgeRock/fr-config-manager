const utils = require("../helpers/utils.js");
const fs = require("fs");
const {
  restPost,
  restGet,
} = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const EXPORT_SUB_DIR = "services";

const EXCLUDE_SERVICES = ["DataStoreService"];
const SOCIAL_IDENTITY_PROVIDER_SERVICE = "SocialIdentityProviders";

async function saveDescendents(targetDir, amEndpoint, serviceName, token) {
  const descendentsEndpoint = `${amEndpoint}/${serviceName}`;

  const response = await restPost(
    descendentsEndpoint,
    {
      _action: "nextdescendents",
    },
    null,
    token,
    "protocol=1.0,resource=1.0"
  );

  const descendents = response.data.result;
  const serviceDir = `${targetDir}/${serviceName}`;
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  for (const descendent of descendents) {
    const descendentName = descendent._id;
    const fileName = `${serviceDir}/${descendentName}.json`;
    saveJsonToFile(descendent, fileName);
  }
}

async function exportConfig(exportDir, realms, tenantUrl, name, token) {
  try {
    for (const realm of realms) {
      const targetDir = `${exportDir}/${realm}/${EXPORT_SUB_DIR}`;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/services`;

      const response = await restGet(
        amEndpoint,
        {
          _queryFilter: "true",
        },
        token
      );

      const services = response.data.result;

      for (const service of services) {
        const serviceName = service._id;
        if (
          EXCLUDE_SERVICES.includes(serviceName) ||
          (name && name !== serviceName)
        ) {
          continue;
        }

        const serviceResponse = await restGet(
          `${amEndpoint}/${serviceName}`,
          null,
          token
        );

        const fileName = `${targetDir}/${serviceName}.json`;
        saveJsonToFile(serviceResponse.data, fileName);

        // Special cases

        if (serviceName === SOCIAL_IDENTITY_PROVIDER_SERVICE) {
          saveDescendents(targetDir, amEndpoint, serviceName, token);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
