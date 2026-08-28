const {
  getCustomPolicies,
  putCustomPolicies,
} = require("../../../fr-config-common/src/custom-policy-utils.js");

async function deleteCustomPolicies(tenantUrl, requestedName, token, dryRun) {
  let policies = [];
  if (requestedName) {
    const currentPolicies = await getCustomPolicies(tenantUrl, token);
    policies = currentPolicies.filter((p) => p.config.policyId !== requestedName);
    if (policies.length === currentPolicies.length) {
      console.log("Warning - policy not found:", requestedName);
      return;
    }
  }

  if (dryRun) {
    console.log(
      requestedName
        ? `Dry run: Deleting custom policy: ${requestedName}`
        : "Dry run: deleting all custom policies"
    );
    return;
  }

  await putCustomPolicies(tenantUrl, token, policies);
}

module.exports.deleteCustomPolicies = deleteCustomPolicies;
