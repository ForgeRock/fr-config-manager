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

async function mergeExistingThemes(newTheme, realm, resourceUrl, token) {
  const response = await restGet(resourceUrl, null, token);

  const themes = response.data;

  const existingThemeIndex = themes.realm[realm].findIndex((el) => {
    return el.name === newTheme.name;
  });

  if (existingThemeIndex >= 0) {
    themes.realm[realm].splice(existingThemeIndex, 1);
  }

  themes.realm[realm].push(newTheme);

  return themes;
}

function processThemes(theme, themePath) {
  try {
    for (const field of THEME_HTML_FIELDS) {
      if (theme[field].file) {
        const breakoutFile = path.join(themePath, theme[field].file);
        const fieldValue = fs.readFileSync(breakoutFile, "utf-8");
        theme[field] = fieldValue;
        continue;
      }

      if (typeof theme[field] !== "object") {
        console.error(
          `Unexpected object type for ${field} in theme ${theme.name}`
        );
        process.exit(1);
      }

      Object.keys(theme[field]).forEach((locale) => {
        const breakoutFile = path.join(themePath, theme[field][locale].file);
        const fieldValue = fs.readFileSync(breakoutFile, "utf-8");
        theme[field][locale] = fieldValue;
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

  var themerealm = {
    _id: "ui/themerealm",
    realm: {},
  };
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
      const realmthemes = [];
      for (const themePath of themes) {
        const themename = path.parse(themePath).base;
        if (requestedThemeName && requestedThemeName !== themename) {
          continue;
        }
        const theme = JSON.parse(
          fs.readFileSync(path.join(themePath, `${themename}.json`))
        );
        const mergedTheme = processThemes(theme, themePath);
        realmthemes.push(mergedTheme);
      }

      themerealm.realm[realm] = realmthemes;
    }
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/ui/themerealm`;

    if (requestedThemeName) {
      themerealm = await mergeExistingThemes(
        themerealm.realm[realms[0]][0],
        realms[0],
        requestUrl,
        token
      );
    }
    await restPut(requestUrl, themerealm, token);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateThemes;
