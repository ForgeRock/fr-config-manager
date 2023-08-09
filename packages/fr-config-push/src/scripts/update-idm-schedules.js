const { existsSync } = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const fileFilter = require("../helpers/file-filter");
const cliUtils = require("../helpers/cli-options");
const { request } = require("http");
const { OPTION } = cliUtils;

const updateIdmSchedules = async (argv, token) => {
  const { TENANT_BASE_URL, filenameFilter, CONFIG_DIR } = process.env;

  const requestedScheduleName = argv[OPTION.NAME];

  if (requestedScheduleName) {
    console.log("Updating schedule", requestedScheduleName);
  } else {
    console.log("Updating schedules");
  }

  try {
    const dir = path.join(CONFIG_DIR, "/schedules");
    const useFF = filenameFilter || argv.filenameFilter;

    if (!existsSync(dir)) {
      console.log("Warning: no schedules config defined");
      return;
    }

    const fileContent = JSON.parse(
      await readFile(path.join(dir, "schedule-config.json"))
    );

    // Update each script
    fileContent.forEach(async (schedule) => {
      const scheduleName = schedule._id.split("/")[1];
      if (requestedScheduleName && requestedScheduleName !== scheduleName) {
        return;
      }
      if (!fileFilter(schedule.file, useFF)) {
        return;
      }
      const requestUrl = `${TENANT_BASE_URL}/openidm/config/${schedule._id}`;
      if (
        schedule.invokeService === "script" &&
        schedule.invokeContext.script.file
      ) {
        await readFile(
          `${dir}/${schedule.invokeContext.script.file}`,
          "utf-8",
          async (err, data) => {
            if (err) {
              return console.log(err);
            }
            schedule.invokeContext.script.source = data;
            delete schedule.invokeContext.script.file;
            fidcRequest(requestUrl, schedule, token);
            console.log(`IDM schedule updated: ${schedule._id}`);
          }
        );
      } else if (
        schedule.invokeService === "taskscanner" &&
        schedule.invokeContext.task.script.file
      ) {
        await readFile(
          `${dir}/${schedule.invokeContext.task.script.file}`,
          "utf-8",
          async (err, data) => {
            if (err) {
              return console.log(err);
            }
            schedule.invokeContext.task.script.source = data;
            delete schedule.invokeContext.task.script.file;
            fidcRequest(requestUrl, schedule, token);
            console.log(`IDM taskscanner updated: ${schedule._id}`);
          }
        );
      } else {
        fidcRequest(requestUrl, schedule, token);
        console.log(`IDM taskscanner updated: ${schedule._id}`);
      }
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateIdmSchedules;
