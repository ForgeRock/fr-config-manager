const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const {
  restGet,
  restPost,
} = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;

const EXPORT_SUBDIR = "cookie-domains";
const EXPORT_FILENAME = "cookie-domains.json";

async function exportCookieDomains(exportDir, tenantUrl, token) {
  try {
    const endpoint = `${tenantUrl}/environment/cookie-domains`;

    const cookieDomainsResponse = await restGet(endpoint, null, token);

    const cookieDomains = cookieDomainsResponse.data;

    const exportPath = `${exportDir}/${EXPORT_SUBDIR}`;

    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    saveJsonToFile(cookieDomains, `${exportPath}/${EXPORT_FILENAME}`);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportCookieDomains = exportCookieDomains;
