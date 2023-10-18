const fs = require("fs");
const { saveJsonToFile } = require("../../../fr-config-common/src/utils.js");
const { AuthzTypes } = require("../../../fr-config-common/src/constants.js");
const {
  restGet,
  logRestError,
} = require("../../../fr-config-common/src/restClient.js");
const EXPORT_SUBDIR = "authorization";

async function saveResourceType(
  exportDir,
  resourceTypeUuid,
  realm,
  tenantUrl,
  token
) {
  try {
    const resourceTypeDir = `${exportDir}/realms/${realm}/${EXPORT_SUBDIR}/resource-types`;
    if (!fs.existsSync(resourceTypeDir)) {
      fs.mkdirSync(resourceTypeDir, { recursive: true });
    }

    const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/resourcetypes/${resourceTypeUuid}`;

    const response = await restGet(amEndpoint, null, token);

    const resourceType = response.data;

    const fileName = `${resourceTypeDir}/${resourceType.name}.json`;
    saveJsonToFile(resourceType, fileName);
  } catch (err) {
    logRestError(err);
  }
}

async function exportPolicies(
  exportDir,
  targetDir,
  realm,
  policySet,
  tenantUrl,
  token
) {
  try {
    const policyDir = `${targetDir}/policies`;
    if (!fs.existsSync(policyDir)) {
      fs.mkdirSync(policyDir, { recursive: true });
    }

    const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/policies`;

    const response = await restGet(
      amEndpoint,
      {
        _queryFilter: `applicationName eq "${policySet}"`,
      },
      token
    );

    response.data.result.forEach((policy) => {
      const fileName = `${policyDir}/${policy.name}.json`;
      saveJsonToFile(policy, fileName);
      saveResourceType(
        exportDir,
        policy.resourceTypeUuid,
        realm,
        tenantUrl,
        token
      );
    });
  } catch (err) {
    logRestError(err);
  }
}

async function exportConfig(exportDir, policySetsConfigFile, tenantUrl, token) {
  try {
    var policySets = JSON.parse(fs.readFileSync(policySetsConfigFile, "utf8"));
    for (const realm of Object.keys(policySets)) {
      for (const policySet of policySets[realm]) {
        const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/applications/${policySet}`;

        const response = await restGet(amEndpoint, null, token);

        const config = response.data;

        const targetDir = `${exportDir}/realms/${realm}/${EXPORT_SUBDIR}/policy-sets/${policySet}`;
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const fileName = `${targetDir}/${policySet}.json`;
        saveJsonToFile(config, fileName);

        exportPolicies(
          exportDir,
          targetDir,
          realm,
          policySet,
          tenantUrl,
          token
        );
      }
    }
  } catch (err) {
    logRestError(err);
  }
}

module.exports.exportConfig = exportConfig;
