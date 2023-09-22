const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const updateLocales = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  const requestedLocaleName = argv[OPTION.NAME];
  if (requestedLocaleName) {
    console.log("Updating locale", requestedLocaleName);
  } else {
    console.log("Updating locales");
  }

  try {
    const dir = path.join(CONFIG_DIR, "/locales");

    if (!fs.existsSync(dir)) {
      console.log("Warning: no locales defined");
      return;
    }

    const localeFiles = fs
      .readdirSync(dir)
      .filter((name) => path.extname(name) === ".json");

    for (const localeFile of localeFiles) {
      var localeFileContent = fs.readFileSync(
        path.join(dir, localeFile),
        "utf8"
      );

      let localeObject = JSON.parse(localeFileContent);
      const localeName = localeObject._id.split("/")[1];
      if (requestedLocaleName && requestedLocaleName !== localeName) {
        continue;
      }
      const requestUrl = `${TENANT_BASE_URL}/openidm/config/${localeObject._id}`;
      await restPut(requestUrl, localeObject, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateLocales;
