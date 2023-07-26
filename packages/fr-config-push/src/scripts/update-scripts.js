const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const fileFilter = require("../helpers/file-filter");
const uglifyJS = require("uglify-js");

function regexIndexOf(text, re, i) {
  const indexInSuffix = text.slice(i).search(re);
  return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
}

function lintWithWarnings(scriptName, mergedScript, lintingWarnedScripts) {
  if (!mergedScript || !scriptName.endsWith(".js")) {
    return mergedScript;
  }

  const arr = mergedScript.toString().replace(/\r\n/g, "\n").split("\n");

  let warning = false;

  for (let i = 0; i < arr.length; i++) {
    const line = arr[i];
    if (regexIndexOf(line, "(^|[\\s+])let[\\s+]", 0) > -1) {
      console.warn(
        "\n** WARNING: Linting issue with 'usage of let' in script : " +
          scriptName +
          " (line " +
          (i + 1) +
          ")\n"
      );
      warning = true;
    }
  }

  if (warning) {
    lintingWarnedScripts.push(scriptName);
  }
}

const updateScripts = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR, filenameFilter } = process.env;

  console.log("Updating scripts");
  try {
    for (const realm of JSON.parse(REALMS)) {
      const dir = path.join(CONFIG_DIR, `/realms/${realm}/scripts`);
      const useFF = filenameFilter || argv.filenameFilter;

      if (!fs.existsSync(dir)) {
        console.log(`Warning: no script config defined in realm ${realm}`);
        continue;
      }

      const scriptFileContent = fs
        .readdirSync(dir)
        .filter((name) => path.extname(name) === ".json") // Filter out any non JSON files
        .map((filename) =>
          JSON.parse(fs.readFileSync(path.join(dir, filename)))
        ); // Map JSON file content to an array

      const lintingWarnedScripts = [];
      const baseUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}`;

      for (const script of scriptFileContent) {
        if (!fileFilter(script.script.file, useFF)) {
          continue;
        }

        if (!script.name || script.name.trim() === "") {
          throw new Error(
            `ERROR script Id : ${script._id} must have a valid (non-blank) name!`
          );
        }

        // updates the script content with encoded file
        const originalScript = fs.readFileSync(`${dir}/${script.script.file}`, {
          encoding: "utf-8",
        });

        lintWithWarnings(
          script.script.file,
          originalScript,
          lintingWarnedScripts
        );

        script.script = Buffer.from(originalScript).toString("base64");

        const requestUrl = `${baseUrl}/scripts/${script._id}`;

        await fidcRequest(requestUrl, script, token);
      }
      if (lintingWarnedScripts.length > 0) {
        console.warn(
          "\n** Linting warnings for scripts : " + lintingWarnedScripts + "\n"
        );
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateScripts;
