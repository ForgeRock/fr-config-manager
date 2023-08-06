const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const HTML_FIELDS = ["accountFooter", "journeyFooter", "journeyHeader"];

function processThemes(theme, themePath) {
  try {
    for (const field of HTML_FIELDS) {
      const fieldFilename = `${field}.html`;
      const breakoutFile = `${themePath}/${fieldFilename}`;
      const file = fs.readFileSync(breakoutFile, "utf-8");
      theme[field] = file;
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

    await fidcRequest(requestUrl, themerealm, token);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateThemes;
