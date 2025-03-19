const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const path = require("path");

const EXPORT_SUB_DIR = "themes";
const {
  THEME_HTML_FIELDS,
} = require("../../../fr-config-common/src/constants.js");

function decodeOrNot(input, encoded) {
  return encoded ? Buffer.from(input, "base64") : input;
}

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
        if (!theme[field.name]) {
          continue;
        }

        switch (typeof theme[field.name]) {
          case "string":
            {
              const fieldFilename = `${field.name}.html`;
              const breakoutFile = path.join(themePath, fieldFilename);
              fs.writeFileSync(
                breakoutFile,
                decodeOrNot(theme[field.name], field.encoded)
              );
              theme[field.name] = {
                file: fieldFilename,
              };
            }
            break;

          case "object":
            const fieldPath = path.join(themePath, field.name);
            if (!fs.existsSync(fieldPath)) {
              fs.mkdirSync(fieldPath, { recursive: true });
            }

            Object.keys(theme[field.name]).forEach((locale) => {
              {
                const localeFilename = path.join(field.name, `${locale}.html`);
                const breakoutFile = path.join(themePath, localeFilename);
                fs.writeFileSync(
                  breakoutFile,
                  decodeOrNot(theme[field.name][locale], field.encoded)
                );
                theme[field.name][locale] = {
                  file: localeFilename,
                };
              }
            });
            break;

          default:
            console.error(
              `Error processing theme ${
                theme.name
              } - unexpected data type for ${field.name}: ${typeof theme[
                field.name
              ]}`
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

      if (!response.data.realm || !response.data.realm[realm]) {
        continue;
      }

      const themes = response.data.realm[realm];

      const fileDir = `${exportDir}/${realm}/${EXPORT_SUB_DIR}`;
      processThemes(themes, fileDir, name);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportThemes = exportThemes;
