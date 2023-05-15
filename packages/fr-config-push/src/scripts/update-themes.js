const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

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

  var themerealm = {
    _id: "ui/themerealm",
    realm: {},
  };
  try {
    console.log("starting");
    for (const realm of JSON.parse(REALMS)) {
      const dir = path.join(CONFIG_DIR, `/realms/${realm}/themes`);
      const themes = fs
        .readdirSync(`${dir}`, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => path.join(`${dir}`, dirent.name));
      const realmthemes = [];
      for (const themePath of themes) {
        const themename = path.parse(themePath).base;
        const theme = JSON.parse(
          fs.readFileSync(path.join(themePath, `${themename}.json`))
        );
        const mergedTheme = processThemes(theme, themePath);
        console.log(`Updating template ${theme.name} in realm ${realm}`);
        realmthemes.push(mergedTheme);
      }
      themerealm.realm[realm] = realmthemes;
    }
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/ui/themerealm`;

    await fidcRequest(requestUrl, themerealm, token);

    console.log("Themes updated");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateThemes;
