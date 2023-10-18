const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;

const SCHEDULE_SUBDIR = "schedules";
const SCHEDULE_CONFIG_FILENAME = "schedule-config.json";
const SCRIPT_CONTENT_SUBDIR = "scripts-content";

function processSchedules(schedules, fileDir, name) {
  try {
    schedules.forEach((schedule) => {
      const scheduleName = schedule._id.split("/")[1];

      if (name && name !== scheduleName) {
        return;
      }
      var scheduleDir = `${fileDir}/${scheduleName}`;
      if (!fs.existsSync(scheduleDir)) {
        fs.mkdirSync(scheduleDir, { recursive: true });
      }

      const scriptFilename = `${scheduleName}.js`;

      if (
        schedule.invokeService === "script" &&
        schedule.invokeContext.script.source
      ) {
        fs.writeFileSync(
          `${scheduleDir}/${scriptFilename}`,
          schedule.invokeContext.script.source
        );
        delete schedule.invokeContext.script.source;
        schedule.invokeContext.script.file = `${scriptFilename}`;
      } else if (
        schedule.invokeService === "taskscanner" &&
        schedule.invokeContext.task.script.source
      ) {
        fs.writeFileSync(
          `${scheduleDir}/${scriptFilename}`,
          schedule.invokeContext.task.script.source
        );
        delete schedule.invokeContext.task.script.source;
        schedule.invokeContext.task.script.file = `${scriptFilename}`;
      }

      const scheduleFilename = `${scheduleDir}/${scheduleName}.json`;
      saveJsonToFile(schedule, scheduleFilename);
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportSchedules(exportDir, tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await restGet(
      idmEndpoint,
      { _queryFilter: '_id sw "schedule/"' },
      token
    );

    const schedules = response.data.result;

    const fileDir = `${exportDir}/${SCHEDULE_SUBDIR}`;
    processSchedules(schedules, fileDir, name);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportSchedules = exportSchedules;
