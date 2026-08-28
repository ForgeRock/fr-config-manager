const { restGet, restPut } = require("./restClient.js");

async function getPolicyConfig(tenantUrl, token) {
  const idmEndpoint = `${tenantUrl}/openidm/config/policy`;
  const response = await restGet(idmEndpoint, null, token);
  const policyConfig = response.data;

  if (!policyConfig) {
    console.error("Failed to get policy config");
    process.exit(1);
  }

  if (!policyConfig.globals) {
    policyConfig.globals = { additionalPolicies: [] };
  } else if (!policyConfig.globals.additionalPolicies) {
    policyConfig.globals.additionalPolicies = [];
  }

  return policyConfig;
}

async function getCustomPolicies(tenantUrl, token) {
  const policyConfig = await getPolicyConfig(tenantUrl, token);
  const policies = policyConfig.globals.additionalPolicies.map((item) => {
    const match = item.match(/^addPolicy\((\{.*\})\);\s*(function[\s\S]*)$/);

    if (!match) {
      console.error("Failed to parse policy config");
      process.exit(1);
    }

    return {
      config: JSON.parse(match[1]),
      function: match[2],
    };
  });

  return policies;
}

async function putCustomPolicies(tenantUrl, token, policies) {
  const additionalPolicies = policies.map((item) => {
    return `addPolicy(${JSON.stringify(item.config)}); ${item.function}`;
  });

  let policyConfig = await getPolicyConfig(tenantUrl, token);
  policyConfig.globals.additionalPolicies = additionalPolicies;

  await restPut(`${tenantUrl}/openidm/config/policy`, policyConfig, token);
}

module.exports.getCustomPolicies = getCustomPolicies;
module.exports.putCustomPolicies = putCustomPolicies;
