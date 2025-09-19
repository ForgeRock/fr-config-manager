const { restGet, restPut } = require("../../../fr-config-common/src/restClient.js");

async function processTermsVersions(terms, versions, name, token, idmEndpoint, dryRun) {
  let matchFound = false;
  for (const version of versions) {
    const versionId = version.version;

    if (name && name !== versionId) {
      continue; 
    }

    matchFound = true;

    const updatedVersions = terms.versions.filter(version => version.version !== versionId);

    if (dryRun) {
      console.log(`Dry run: Deleting terms and condtions version: ${versionId}`);
      continue;
    }

    terms.versions = updatedVersions;

    try {
      await restPut(idmEndpoint, terms, token, null, true);
      console.log(`Deleting terms and condtions version: ${versionId}`);
    } catch (err) {
      console.error(`Error deleting terms and condtions version ${versionId}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: terms and condtions version '${name}' not found.`);
  }
}

async function deleteTerms(tenantUrl, name, token, dryRun) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/selfservice.terms`;

    const response = await restGet(idmEndpoint, null, token);
    const terms = response.data;

    const versions = terms.versions;

    if (versions.length === 0) {
      console.log("No terms and condtions versions found to delete.");
      return;
    }

    await processTermsVersions(terms, versions, name, token, idmEndpoint, dryRun);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteTerms = deleteTerms;
