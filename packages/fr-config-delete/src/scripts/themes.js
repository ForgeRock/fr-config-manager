const { restGet, restPut } = require("../../../fr-config-common/src/restClient.js");


async function processThemes(themesDoc, themes, realmName, name, token, idmEndpoint) {
  let matchFound = false;
  for (const theme of themes) {
    const themeName = theme.name;

    if (name && name !== themeName) {
      continue; 
    }

    matchFound = true;

    const updatedThemes = themesDoc.realm[realmName].filter(theme => theme.name !== themeName);

    themesDoc.realm[realmName] = updatedThemes;

    try {
      await restPut(idmEndpoint, themesDoc, token, null, true);
      console.log(`Deleting theme: ${themeName}`);
    } catch (err) {
      console.error(`Error deleting theme ${themeName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: theme '${name}' not found in realm '${realmName}'.`);
  }
}

async function deleteThemes(realms, tenantUrl, name, token) {
  try {
    for (const realm of realms) {
      const idmEndpoint = `${tenantUrl}/openidm/config/ui/themerealm`;

      const response = await restGet(idmEndpoint, null, token);

      if (!response.data.realm || !response.data.realm[realm]) {
        continue;
      }

      const themesDoc = response.data;

      const themesByRealmArray = themesDoc.realm[realm];

      if (themesByRealmArray.length === 0) {
        console.log(`No themes found to delete in realm ${realm}.`);
        return;
      }

      await processThemes(themesDoc, themesByRealmArray, realm, name, token, idmEndpoint);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteThemes = deleteThemes;