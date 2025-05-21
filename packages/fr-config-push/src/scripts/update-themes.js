const fs = require("fs");
const path = require("path");
const {
  restPut,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const EXPORT_SUB_DIR = "themes";
const {
  THEME_HTML_FIELDS,
} = require("../../../fr-config-common/src/constants.js");

function mergeExistingThemes(existingThemes, newTheme) {
  const existingThemeIndex = existingThemes.findIndex((el) => {
    return el.name === newTheme.name;
  });

  if (existingThemeIndex >= 0) {
    existingThemes.splice(existingThemeIndex, 1);
  }

  existingThemes.push(newTheme);

  return existingThemes;
}

function encodeOrNot(input, encoded) {
  return encoded ? Buffer.from(input).toString("base64") : input;
}

function processTheme(theme, themePath) {
  try {
    for (const field of THEME_HTML_FIELDS) {
      if (!theme[field.name]) {
        continue;
      }

      if (typeof theme[field.name] === "string") {
        continue;
      }

      if (theme[field.name].file) {
        const breakoutFile = path.join(themePath, theme[field.name].file);
        const fieldValue = fs.readFileSync(breakoutFile, "utf-8");
        theme[field.name] = encodeOrNot(fieldValue, field.encoded);
        continue;
      }

      if (typeof theme[field.name] !== "object") {
        console.error(
          `Unexpected object type for ${field.name} in theme ${
            theme.name
          }: ${typeof theme[field.name]}`
        );
        process.exit(1);
      }

      Object.keys(theme[field.name]).forEach((locale) => {
        const breakoutFile = path.join(
          themePath,
          theme[field.name][locale].file
        );
        const fieldValue = fs.readFileSync(breakoutFile, "utf-8");
        theme[field.name][locale] = encodeOrNot(fieldValue, field.encoded);
      });
    }
    return theme;
  } catch (err) {
    console.error(err);
  }
}

const updateThemes = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;
  const requestedThemeName = argv[OPTION.NAME];
  const realms = argv[OPTION.REALM] ? [argv[OPTION.REALM]] : JSON.parse(REALMS);

  if (requestedThemeName) {
    if (realms.length !== 1) {
      console.error("Error: for a named theme, specify a single realm");
      process.exit(1);
    } else {
      console.log("Updating theme", requestedThemeName);
    }
  } else {
    console.log("Updating themes");
  }

  const resourceUrl = `${TENANT_BASE_URL}/openidm/config/ui/themerealm`;
  var response = await restGet(resourceUrl, null, token);

  var themerealm = response.data;

  try {
    for (const realm of realms) {
      const dir = path.join(CONFIG_DIR, `/realms/${realm}/themes`);
      if (!fs.existsSync(dir)) {
        console.log(`Warning: no themes config defined in realm ${realm}`);
        continue;
      }
      const themes = fs
        .readdirSync(`${dir}`, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => path.join(`${dir}`, dirent.name));
      var realmthemes = [];
      for (const themePath of themes) {
        const themename = path.parse(themePath).base;
        if (requestedThemeName && requestedThemeName !== themename) {
          continue;
        }
        const theme = JSON.parse(
          fs.readFileSync(path.join(themePath, `${themename}.json`))
        );
        const flattenedTheme = processTheme(theme, themePath);
        if (requestedThemeName) {
          realmthemes = mergeExistingThemes(
            themerealm.realm[realm],
            flattenedTheme
          );
          break;
        }
        realmthemes.push(flattenedTheme);
      }

      themerealm.realm[realm] = realmthemes;
    }

    await restPut(resourceUrl, themerealm, token);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateThemes;
