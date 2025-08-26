const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

async function processRoles(roles, name, tenantUrl, token) {
  let matchFound = false;
  for (const role of roles) {
    const roleName = role.name;

    if (name && name !== roleName) {
      continue;
    }
    // We don't want to delete system roles - assuming that system roles have no privileges
    if (role.privileges && role.privileges.length > 0) {
      matchFound = true;
      const idmEndpoint = `${tenantUrl}/openidm/internal/role/${role._id}`;
      try {
        await restDelete(idmEndpoint, null, token, null, true);
        console.log(`Successfully deleted internal role: ${roleName}`);
      } catch (err) {
        console.error(`Failed to delete internal role ${roleName}:`, err);
      }
    }
  }
  if (name && !matchFound) {
    console.log(`Warning: Role '${name}' not found.`);
  }
}

async function deleteInternalRoles(tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/internal/role`;

    const response = await restGet(
      idmEndpoint,
      {
        _queryFilter: "true",
      },
      token
    );

    const roles = response.data.result;
    
    await processRoles(roles, name, tenantUrl, token);
  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteInternalRoles = deleteInternalRoles;