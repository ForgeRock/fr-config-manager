const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const updateLocales = async (argv, token) => {
  console.log("Updating locales");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

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
      const requestUrl = `${TENANT_BASE_URL}/openidm/config/${localeObject._id}`;
      await fidcRequest(requestUrl, localeObject, token);
    }

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateLocales;
