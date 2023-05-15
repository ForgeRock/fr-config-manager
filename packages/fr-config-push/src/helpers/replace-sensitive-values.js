const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const envsub = require("envsub");
const { config } = require("yargs");

let envsubOptions = {
  all: false,
  diff: false,
  protect: true,
  syntax: "handlebars",
  system: true,
};

const replaceSensitiveValues = async (dir) => {
  try {
    const templateFiles = fs
      .readdirSync(dir)
      .filter((name) => path.extname(name) === ".tpl") // Filter out any non TPL files
      .map((filename) => `${dir}/${filename}`);

    const configFiles = templateFiles.map((filename) =>
      filename.replace(".tpl", "")
    );

    // Copy template files to config files
    await Promise.all(
      templateFiles.map((templateFile, index) => {
        const configFile = configFiles[index];
        console.log(configFile);
        envsub({
          templateFile: templateFile,
          outputFile: configFile,
          options: envsubOptions,
        })
          .then((envobj) => {
            console.log("handled template " + envobj.templateFile);
          })
          .catch((err) => {
            console.error(err.message);
          });
      })
    );
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = replaceSensitiveValues;
