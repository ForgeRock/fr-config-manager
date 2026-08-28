const { existsSync } = require("fs");
const path = require("path");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;
const fs = require("fs");
const {
  getCustomPolicies,
  putCustomPolicies,
} = require("../../../fr-config-common/src/custom-policy-utils.js");

const updateCustomPolicies = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const requestedPolicyName = argv[OPTION.NAME];

  try {
    const dir = path.join(CONFIG_DIR, "/custom-policies");

    if (!existsSync(dir)) {
      console.log("Warning: no local custom policies directory");
      return;
    }

    let policies = await getCustomPolicies(TENANT_BASE_URL, token);

    const policyPaths = fs
      .readdirSync(`${dir}`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(dir, dirent.name));

    for (const policyPath of policyPaths) {
      const policyDirName = path.parse(policyPath).base;
      const policyConfig = JSON.parse(
        fs.readFileSync(path.join(policyPath, `${policyDirName}.json`))
      );
      if (requestedPolicyName && policyConfig.policyId !== requestedPolicyName) {
        continue;
      }
      const policyFunction = fs.readFileSync(path.join(policyPath, `${policyDirName}.js`));

      policies = policies.filter((p) => p.config.policyId !== policyConfig.policyId);
      policies.push({ config: policyConfig, function: policyFunction });
    }

    await putCustomPolicies(TENANT_BASE_URL, token, policies);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateCustomPolicies;
