const {
  restGet,
  restDelete,
} = require("../../../fr-config-common/src/restClient.js");
const DELETE_API_VERISION = "protocol=2.1,resource=1.0";

/**
 * Helper to build a query filter for script prefixes.
 */
function buildQueryFilter(prefixes) {
  if (!Array.isArray(prefixes) || prefixes.length === 0) return "true";
  return prefixes
    .map((p, i) => `${i === 0 ? "" : "+or+"}name+sw+\"${p}\"`)
    .join("");
}

/**
 * Process scripts in a realm matching the query filter.
 * Throws on error instead of exiting process.
 */
async function processScripts(tenantUrl, realm, queryFilter, token, dryRun) {
  const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts?_queryFilter=${queryFilter}`;
  let response;
  try {
    response = await restGet(amEndpoint, null, token);
  } catch (err) {
    throw new Error(`Failed to fetch scripts: ${err}`);
  }
  const scripts = response.data.result;
  for (const script of scripts) {
    if (script.language !== "JAVASCRIPT") continue;
    if (dryRun) {
      console.log(`Dry run: Deleting script ${script.name} (${script._id})`);
      continue;
    }
    await deleteScriptById(tenantUrl, realm, script._id, token, dryRun);
  }
}

/**
 * Delete a script by name in a realm. Throws on error.
 */
async function deleteScriptByName(tenantUrl, realm, name, token, dryRun) {
  const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts?_queryFilter=name+eq+\"${name}\"`;
  let response;
  try {
    response = await restGet(amEndpoint, null, token);
  } catch (err) {
    throw new Error(`Error fetching script: ${err}`);
  }
  if (response.status !== 200) {
    throw new Error(`Error fetching script: ${response.data}`);
  }
  const scripts = response.data.result;
  if (scripts.length === 0) {
    throw new Error(`No script found with the name: ${name}`);
  }
  if (scripts.length > 1) {
    throw new Error(`Error: multiple scripts found with the name: ${name}`);
  }
  const script = scripts[0];
  const scriptId = script._id;
  await deleteScriptById(tenantUrl, realm, scriptId, token, dryRun, name);
  if (!dryRun) {
    console.log(`Script ${name} deleted.`);
  }
}

/**
 * Delete a script by ID in a realm. Throws on error.
 */
async function deleteScriptById(tenantUrl, realm, id, token, dryRun, name) {
  const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts/${id}`;
  if (dryRun) {
    console.log(`Dry run: Deleting script with ID ${id}`);
    return;
  }
  const response = await restDelete(amEndpoint, token, DELETE_API_VERISION);
  if (response.status > 299) {
    throw new Error(`Error deleting script: ${response.data}`);
  }
  if (!name) {
    console.log(`Script with ID ${id} deleted.`);
  }
}

/**
 * Main entry: delete scripts by name or by prefix in one or more realms.
 * Throws on error, does not exit process.
 */
async function deleteScripts(tenantUrl, realms, prefixes, name, token, dryRun) {
  if (!Array.isArray(realms) || realms.length === 0) {
    throw new Error("Error: No realms found");
  }
  if (realms.length > 1 && !!name) {
    throw new Error(
      "Error: Cannot delete script by name when multiple realms are provided"
    );
  }
  if (!!name) {
    await deleteScriptByName(tenantUrl, realms[0], name, token, dryRun);
    return;
  }
  let scriptPrefixes;
  try {
    scriptPrefixes = JSON.parse(prefixes);
    if (!Array.isArray(scriptPrefixes)) {
      throw new Error("script prefixes must be a JSON array");
    }
  } catch (err) {
    throw new Error("Error: script prefixes must be valid JSON array");
  }
  const queryFilter = buildQueryFilter(scriptPrefixes);
  for (const realm of realms) {
    await processScripts(tenantUrl, realm, queryFilter, token, dryRun);
  }
}

module.exports = {
  deleteScripts,
  deleteScriptById,
  deleteScriptByName,
  processScripts, // for testing
  buildQueryFilter, // for testing
};
