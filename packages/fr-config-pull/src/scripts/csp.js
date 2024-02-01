const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile, escapePlaceholders } = utils;
const {
  CSP_POLICIES,
  CSP_SUBDIR,
} = require("../../../fr-config-common/src/constants.js");
const _ = require("lodash");

function overrideCsp(cspConfig, cspOverridesFile) {
  const overrides = JSON.parse(fs.readFileSync(cspOverridesFile, "utf8"));
  const escapedOverrides = escapePlaceholders(overrides);
  const mergedConfig = _.merge(cspConfig, escapedOverrides);

  return mergedConfig;
}

async function exportCsp(exportDir, cspOverridesFile, tenantUrl, name, token) {
  try {
    const fileDir = `${exportDir}/${CSP_SUBDIR}`;
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    const policies = name ? [name] : CSP_POLICIES;
    let csp = {};

    for (const policy of policies) {
      const cspEndpoint = `${tenantUrl}/environment/content-security-policy/${policy}`;
      const response = await restGet(
        cspEndpoint,
        null,
        token,
        "protocol=1.0,resource=1.0"
      );

      csp[policy] = response.data;
    }

    if (cspOverridesFile) {
      csp = overrideCsp(csp, cspOverridesFile);
    }
    saveJsonToFile(csp, `${fileDir}/csp.json`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

module.exports.exportCsp = exportCsp;
