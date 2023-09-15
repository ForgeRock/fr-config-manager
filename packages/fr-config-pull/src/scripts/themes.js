const utils = require("../helpers/utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

const EXPORT_SUB_DIR = "themes";

const HTML_FIELDS = ["accountFooter", "journeyFooter", "journeyHeader"];

function processThemes(themes, fileDir, name) {
  try {
    themes.forEach((theme) => {
      if (name && name !== theme.name) {
        return;
      }
      const themePath = `${fileDir}/${theme.name}`;

      if (!fs.existsSync(themePath)) {
        fs.mkdirSync(themePath, { recursive: true });
      }

      for (const field of HTML_FIELDS) {
        const fieldFilename = `${field}.html`;
        const breakoutFile = `${themePath}/${fieldFilename}`;
        fs.writeFileSync(breakoutFile, theme[field]);
        theme[field] = {
          file: fieldFilename,
        };
      }

      const fileName = `${themePath}/${theme.name}.json`;
      saveJsonToFile(theme, fileName);
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportThemes(exportDir, realms, tenantUrl, name, token) {
  try {
    for (const realm of realms) {
      const idmEndpoint = `${tenantUrl}/openidm/config/ui/themerealm`;

      const response = await axios({
        method: "get",
        url: idmEndpoint,
        params: { _fields: `realm/${realm}` },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const themes = response.data.realm[realm];

      const fileDir = `${exportDir}/${realm}/${EXPORT_SUB_DIR}`;
      processThemes(themes, fileDir, name);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportThemes = exportThemes;
