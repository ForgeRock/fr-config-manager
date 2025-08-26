const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

async function processSchedules(schedules, name, tenantUrl, token) {
  let matchFound = false;
  for (const schedule of schedules) {
    const scheduleName = schedule._id.split("/")[1];

    if (name && name !== scheduleName) {
      continue;
    }

    matchFound = true;

    const idmEndpoint = `${tenantUrl}/openidm/config/${schedule._id}`;

    try {
      await restDelete(idmEndpoint, token, null, true);
      console.log(`Successfully deleted schedule: ${scheduleName}`);
    } catch (err) {
      console.error(`Failed to delete schedule ${scheduleName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: schedule '${name}' not found.`);
  }
}

async function deleteSchedules(tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await restGet(
      idmEndpoint,
      { _queryFilter: '_id sw "schedule/"' },
      token
    );

    const schedules = response.data.result;

    if (schedules.length === 0) {
      console.log("No schedules found to delete.");
      return;
    }

    await processSchedules(schedules, name, tenantUrl, token);
  } catch (err) {
    console.error("Error fetching or deleting schedules:", err);
  }
}

module.exports.deleteSchedules = deleteSchedules;