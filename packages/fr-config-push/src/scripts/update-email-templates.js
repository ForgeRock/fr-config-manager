const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

function mergeFileContent(templateObject, templatePath) {
  if (typeof templateObject === "object") {
    const content = fs.readFileSync(
      path.join(templatePath, templateObject["file"]),
      { encoding: "utf-8" }
    );
    templateObject = content;
  }
  return templateObject;
}
function mergeLangFile(langObject, templatePath) {
  Object.entries(langObject).forEach(([lang, text]) => {
    if (typeof text === "object") {
      const content = fs.readFileSync(path.join(templatePath, text["file"]), {
        encoding: "utf-8",
      });
      langObject[lang] = content;
    }
  });
}
const updateEmailTemplates = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    const dir = path.join(CONFIG_DIR, "/email-templates");
    const requestedTemplateName = argv[OPTION.NAME];

    if (requestedTemplateName) {
      console.log("Updating email template", requestedTemplateName);
    } else {
      console.log("Updating email templates");
    }

    if (!fs.existsSync(dir)) {
      console.log("Warning: no email-templates config defined");
      return;
    }
    const emailTemplates = fs
      .readdirSync(`${dir}`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(`${dir}`, dirent.name));

    for (const emailTemplatePath of emailTemplates) {
      const templatename = path.parse(emailTemplatePath).base;
      if (requestedTemplateName && requestedTemplateName !== templatename) {
        continue;
      }
      const template = JSON.parse(
        fs.readFileSync(path.join(emailTemplatePath, `${templatename}.json`))
      );
      if (template.message) {
        mergeLangFile(template.message, emailTemplatePath);
      }
      if (template.html) {
        mergeLangFile(template.html, emailTemplatePath);
      }
      if (template.styles) {
        template.styles = mergeFileContent(template.styles, emailTemplatePath);
      }
      const requestUrl = `${TENANT_BASE_URL}/openidm/config/${template._id}`;
      await restPut(requestUrl, template, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateEmailTemplates;
