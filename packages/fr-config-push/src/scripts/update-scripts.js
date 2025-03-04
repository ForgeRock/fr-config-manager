const fs = require("fs");
const path = require("path");
const {
  restPut,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const fileFilter = require("../helpers/file-filter");
const uglifyJS = require("uglify-js");
const { OPTION } = require("../helpers/cli-options");
const { isEqual } = require("lodash");

function regexIndexOf(text, re, i) {
  const indexInSuffix = text.slice(i).search(re);
  return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
}

async function pushScriptById(
  configDir,
  scriptId,
  tenantBaseUrl,
  realm,
  token,
  updateOnlyChangedScripts
) {
  const baseDir = path.join(configDir, `/realms/${realm}/scripts`);
  const scriptConfigDir = path.join(baseDir, "scripts-config");

  const scriptConfigFile = path.join(scriptConfigDir, `${scriptId}.json`);
  const scriptJson = fs.readFileSync(scriptConfigFile);
  const script = JSON.parse(scriptJson);

  let lintingWarnedScripts = [];

  await pushScript(
    script,
    baseDir,
    tenantBaseUrl,
    realm,
    lintingWarnedScripts,
    token,
    updateOnlyChangedScripts
  );

  if (lintingWarnedScripts.length > 0) {
    console.warn("\n** Linting warnings for script", lintingWarnedScripts[0]);
  }
}

async function pushScript(
  script,
  dir,
  tenantBaseUrl,
  realm,
  lintingWarnedScripts,
  token,
  updateOnlyChangedScripts
) {
  const originalScript = fs.readFileSync(`${dir}/${script.script.file}`, {
    encoding: "utf-8",
  });

  lintWithWarnings(script.script.file, originalScript, lintingWarnedScripts);

  script.script = Buffer.from(originalScript).toString("base64");

  delete script.createdBy;
  delete script.creationDate;
  delete script.lastModifiedBy;
  delete script.lastModifiedDate;

  const baseUrl = `${tenantBaseUrl}/am/json/realms/root/realms/${realm}`;
  const requestUrl = `${baseUrl}/scripts/${script._id}`;
  let updateNeeded = true;
  if (updateOnlyChangedScripts) {
    const currentScriptResponse = await restGet(
      requestUrl,
      null,
      token,
      "protocol=2.0,resource=1.0",
      true
    );

    // compare if the script is already up to date
    if (!!currentScriptResponse) {
      const currentScript = currentScriptResponse.data;
      delete currentScript.createdBy;
      delete currentScript.creationDate;
      delete currentScript.lastModifiedBy;
      delete currentScript.lastModifiedDate;
      if (isEqual(currentScript, script)) {
        updateNeeded = false;
      }
    }
  }

  // fix issue where null description becomes "null"
  if (script.description === null) {
    script.description = "";
  }

  if (updateNeeded) {
    //console.log(`Updating script ${JSON.stringify(script)}`);
    await restPut(requestUrl, script, token, "protocol=2.0,resource=1.0");
  } else {
    console.log(`No change in script ${script.name} - skipping update`);
  }
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
  const {
    REALMS,
    TENANT_BASE_URL,
    CONFIG_DIR,
    filenameFilter,
    UPDATE_CHANGED_ONLY,
  } = process.env;

  const scriptName = argv[OPTION.NAME];
  const realms = argv[OPTION.REALM] ? [argv[OPTION.REALM]] : JSON.parse(REALMS);
  const updateOnlyChangedScripts = UPDATE_CHANGED_ONLY
    ? JSON.parse(UPDATE_CHANGED_ONLY)
    : false;
  let scriptNotFound = false;

  if (scriptName) {
    if (realms.length !== 1) {
      console.error("Error: for a named script, specify a single realm");
      process.exit(1);
    } else {
      scriptNotFound = true;
      console.log(`Updating script ${scriptName}`);
    }
  } else {
    console.log("Updating scripts");
  }

  try {
    for (const realm of realms) {
      const baseDir = path.join(CONFIG_DIR, `/realms/${realm}/scripts`);
      const configDir = path.join(baseDir, "scripts-config");

      const useFF = filenameFilter || argv.filenameFilter;

      if (!fs.existsSync(configDir)) {
        console.log(
          "Warning: no script config defined in realm",
          realm,
          "Expecting directory",
          configDir
        );
        continue;
      }

      const scriptFileContent = fs
        .readdirSync(configDir)
        .filter((name) => path.extname(name) === ".json") // Filter out any non JSON files
        .map((filename) =>
          JSON.parse(fs.readFileSync(path.join(configDir, filename)))
        ); // Map JSON file content to an array

      const lintingWarnedScripts = [];

      for (const script of scriptFileContent) {
        if (!fileFilter(script.script.file, useFF)) {
          continue;
        }

        if (!script.name || script.name.trim() === "") {
          throw new Error(
            `ERROR script Id : ${script._id} must have a valid (non-blank) name!`
          );
        }

        if (scriptName && script.name !== scriptName) {
          continue;
        }

        scriptNotFound = false;

        pushScript(
          script,
          baseDir,
          TENANT_BASE_URL,
          realm,
          lintingWarnedScripts,
          token,
          updateOnlyChangedScripts
        );
      }
      if (lintingWarnedScripts.length > 0) {
        console.warn(
          "\n** Linting warnings for scripts : " + lintingWarnedScripts + "\n"
        );
      }
    }
    if (scriptName && scriptNotFound) {
      console.warn("Script not found");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports.updateScripts = updateScripts;
module.exports.pushScriptById = pushScriptById;
