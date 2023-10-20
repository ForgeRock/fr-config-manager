const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const path = require("path");

const EXPORT_SUB_DIR = "themes";
const {
  THEME_HTML_FIELDS,
} = require("../../../fr-config-common/src/constants.js");

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

      for (const field of THEME_HTML_FIELDS) {
        switch (typeof theme[field]) {
          case "string":
            {
              const fieldFilename = `${field}.html`;
              const breakoutFile = path.join(themePath, fieldFilename);
              fs.writeFileSync(breakoutFile, theme[field]);
              theme[field] = {
                file: fieldFilename,
              };
            }
            break;

          case "object":
            const fieldPath = path.join(themePath, field);
            if (!fs.existsSync(fieldPath)) {
              fs.mkdirSync(fieldPath, { recursive: true });
            }

            Object.keys(theme[field]).forEach((locale) => {
              {
                const localeFilename = path.join(field, `${locale}.html`);
                const breakoutFile = path.join(themePath, localeFilename);
                fs.writeFileSync(breakoutFile, theme[field][locale]);
                theme[field][locale] = {
                  file: localeFilename,
                };
              }
            });
            break;

          default:
            console.error(
              "Unexpected locale type in theme",
              typeof theme[field]
            );
            process.exit(1);
        }
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

      const response = await restGet(
        idmEndpoint,
        { _fields: `realm/${realm}` },
        token
      );

      const themes = response.data.realm[realm];

      const fileDir = `${exportDir}/${realm}/${EXPORT_SUB_DIR}`;
      processThemes(themes, fileDir, name);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportThemes = exportThemes;
