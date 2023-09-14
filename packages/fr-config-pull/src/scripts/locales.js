const utils = require("../helpers/utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

const LOCALES_SUBDIR = "locales";

function processLocales(locales, fileDir, tenantUrl, name, token) {
  try {
    locales.forEach((locale) => {
      const localeName = locale._id.split("/")[1];

      if (name && name !== localeName) {
        return;
      }

      const idmEndpoint = `${tenantUrl}/openidm/config/${locale._id}`;

      axios({
        method: "get",
        url: idmEndpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((response) => {
        const localeData = response.data;
        const localeFilename = `${fileDir}/${localeName}.json`;

        saveJsonToFile(localeData, localeFilename);
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportLocales(exportDir, tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await axios({
      method: "get",
      url: idmEndpoint,
      params: { _queryFilter: '_id sw "uilocale/"' },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const locales = response.data.result;

    const fileDir = `${exportDir}/${LOCALES_SUBDIR}`;
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    processLocales(locales, fileDir, tenantUrl, name, token);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportLocales = exportLocales;
