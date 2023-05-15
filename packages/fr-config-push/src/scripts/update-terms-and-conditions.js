const path = require("path");
const { readFile } = require("fs/promises");
const fidcRequest = require("../helpers/fidc-request");
const replaceSensitiveValues = require("../helpers/replace-sensitive-values");

async function updateTranslations(fileContent, dir) {
  for (const version of fileContent.versions) {
    for (const [language, text] of Object.entries(version.termsTranslations)) {
      const fileName = `${version.version}/${language}.html`;
      const translation = await readFile(`${dir}/${fileName}`, {
        encoding: "utf-8",
      });
      version.termsTranslations[language] = translation;
    }
  }
}

const updateTermsAndConditions = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Combine managed object JSON files
    const dir = path.join(CONFIG_DIR, "/terms-conditions");

    await replaceSensitiveValues(dir);

    const fileContent = JSON.parse(
      await readFile(`${dir}/terms-conditions.json`)
    );

    await updateTranslations(fileContent, dir);
    const requestUrl = `${TENANT_BASE_URL}/openidm/config/selfservice.terms`;
    await fidcRequest(requestUrl, fileContent, token);
    console.log("Terms and conditions updated");
    return Promise.resolve();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateTermsAndConditions;
