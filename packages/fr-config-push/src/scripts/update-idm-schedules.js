const { existsSync } = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const fileFilter = require("../helpers/file-filter");
const cliUtils = require("../helpers/cli-options");
const { request } = require("http");
const { OPTION } = cliUtils;
const fs = require("fs");

const updateIdmSchedules = async (argv, token) => {
  const { TENANT_BASE_URL, filenameFilter, CONFIG_DIR } = process.env;

  const requestedScheduleName = argv[OPTION.NAME];

  try {
    const dir = path.join(CONFIG_DIR, "/schedules");
    const useFF = filenameFilter || argv.filenameFilter;

    if (!existsSync(dir)) {
      console.log("Warning: no schedules config defined");
      return;
    }

    const schedulePaths = fs
      .readdirSync(`${dir}`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(`${dir}`, dirent.name));

    for (const schedulePath of schedulePaths) {
      const scheduleDirName = path.parse(schedulePath).base;
      const schedule = JSON.parse(
        fs.readFileSync(path.join(schedulePath, `${scheduleDirName}.json`))
      );

      const scheduleName = schedule._id.split("/")[1];

      if (requestedScheduleName && requestedScheduleName !== scheduleName) {
        continue;
      }

      if (
        schedule.invokeService === "script" &&
        schedule.invokeContext.script.file
      ) {
        const scriptData = fs.readFileSync(
          `${schedulePath}/${schedule.invokeContext.script.file}`,
          "utf8"
        );
        schedule.invokeContext.script.source = scriptData;
        delete schedule.invokeContext.script.file;
      } else if (
        schedule.invokeService === "taskscanner" &&
        schedule.invokeContext.task.script.file
      ) {
        const scriptData = fs.readFileSync(
          `${schedulePath}/${schedule.invokeContext.task.script.file}`,
          "utf8"
        );
        schedule.invokeContext.task.script.source = data;
        delete schedule.invokeContext.task.script.file;
      }

      console.log("Updating schedule", scheduleName);
      const requestUrl = `${TENANT_BASE_URL}/openidm/config/${schedule._id}`;
      fidcRequest(requestUrl, schedule, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateIdmSchedules;
