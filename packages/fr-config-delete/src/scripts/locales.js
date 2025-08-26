const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

async function processLocales(locales, tenantUrl, name, token) {
  let matchFound = false;
  for (const locale of locales) {
    const localeName = locale._id.split("/")[1];

    if (name && name !== localeName) {
      continue; 
    }

    matchFound = true;

    const idmEndpoint = `${tenantUrl}/openidm/config/${locale._id}`; // path uilocale/<locale> how _id includes the full path

    try {
      await restDelete(idmEndpoint, token, null, true);
      console.log(`Successfully deleted locale: ${locale._id}`);
    } catch (err) {
      console.error(`Error deleting locale ${locale._id}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: locale '${name}' not found.`);
  }
}

async function deleteLocales(tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await restGet(
      idmEndpoint,
      { _queryFilter: '_id sw "uilocale/"' },
      token
    );
    const locales = response.data.result;

    if (locales.length === 0) {
      console.log("No locales found to delete.");
      return;
    }

    await processLocales(locales, tenantUrl, name, token);

  } catch (err) {
    console.error("Error in deleteLocales:", err);
  }
}

module.exports.deleteLocales = deleteLocales;