const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;
const {
  CSP_POLICIES,
  CSP_SUBDIR,
} = require("../../../fr-config-common/src/constants.js");

const updateCsp = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  const requestedPolicyName = argv[OPTION.NAME];
  if (requestedPolicyName) {
    console.log("Updating csp", requestedPolicyName);
  } else {
    console.log("Updating csp");
  }
  const policies = requestedPolicyName ? [requestedPolicyName] : CSP_POLICIES;

  try {
    const cspFile = path.join(CONFIG_DIR, CSP_SUBDIR, "csp.json");

    if (!fs.existsSync(cspFile)) {
      console.log("Warning: no csp config found");
      return;
    }

    var cspJson = fs.readFileSync(cspFile, "utf8");

    let csp = JSON.parse(cspJson);

    if (requestedPolicyName && !csp[requestedPolicyName]) {
      console.log(`Warning: no config found for policy ${requestedPolicyName}`);
      return;
    }

    for (const policy of policies) {
      if (!csp[policy]) {
        continue;
      }

      const requestUrl = `${TENANT_BASE_URL}/environment/content-security-policy/${policy}`;
      await restPut(requestUrl, csp[policy], token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateCsp;
