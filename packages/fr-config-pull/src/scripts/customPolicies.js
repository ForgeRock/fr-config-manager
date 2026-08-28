const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { getCustomPolicies } = require("../../../fr-config-common/src/custom-policy-utils.js");
const { saveJsonToFile } = utils;
const path = require("path");

const EXPORT_SUB_DIR = "custom-policies";

function processPolicies(policies, fileDir, name) {
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  try {
    policies.forEach((policy) => {
      const policyName = policy.config.policyId;
      if (name && name !== policyName) {
        return;
      }
      const policyPath = path.join(fileDir, policyName);

      if (!fs.existsSync(policyPath)) {
        fs.mkdirSync(policyPath, { recursive: true });
      }
      const configFile = path.join(policyPath, `${policyName}.json`);
      saveJsonToFile(policy.config, configFile);

      const functionFile = path.join(policyPath, `${policyName}.js`);
      fs.writeFileSync(functionFile, policy.function);
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportPolicies(exportDir, tenantUrl, name, token) {
  try {
    const policies = await getCustomPolicies(tenantUrl, token);

    const fileDir = path.join(exportDir, EXPORT_SUB_DIR);
    processPolicies(policies, fileDir, name);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportPolicies = exportPolicies;
