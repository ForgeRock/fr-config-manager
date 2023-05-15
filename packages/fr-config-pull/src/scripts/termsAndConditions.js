const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

const EXPORT_SUB_DIR = "terms-conditions";
const EXPORT_FILE_NAME = "terms-conditions.json";

function processTerms(terms, fileDir) {
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  try {
    terms.versions.forEach((version) => {
      const versionPath = `${fileDir}/${version.version}`;

      if (!fs.existsSync(versionPath)) {
        fs.mkdirSync(versionPath, { recursive: true });
      }

      Object.entries(version.termsTranslations).forEach(([language, text]) => {
        const fileName = `${version.version}/${language}.html`;
        fs.writeFileSync(`${fileDir}/${fileName}`, text);
        version.termsTranslations[language] = {
          file: fileName,
        };
      });
    });

    const configFileName = `${fileDir}/${EXPORT_FILE_NAME}`;
    saveJsonToFile(terms, configFileName);
  } catch (err) {
    console.error(err);
  }
}

async function exportTerms(exportDir, tenantUrl, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/selfservice.terms`;

    const response = await axios({
      method: "get",
      url: idmEndpoint,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const terms = response.data;

    const fileDir = `${exportDir}/${EXPORT_SUB_DIR}`;
    processTerms(terms, fileDir);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportTerms = exportTerms;
