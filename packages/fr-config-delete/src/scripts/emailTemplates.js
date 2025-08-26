const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

async function processEmailTemplates(templates, name, tenantUrl, token) {
  let matchFound = false;
  for (const template of templates) {
    const templateName = template._id.split("/")[1];

    if (name && name !== templateName) {
      continue;
    }

    matchFound = true;

    const idmEndpoint = `${tenantUrl}/openidm/config/${template._id}`;

    try {
      await restDelete(idmEndpoint, token, null, true);
      console.log(`Successfully deleted template: ${templateName}`);
    } catch (err) {
      console.error(`Failed to delete template ${templateName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: Email template '${name}' not found.`);
  }
}

async function deleteEmailTemplates(tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await restGet(
      idmEndpoint,
      { _queryFilter: '_id sw "emailTemplate"' },
      token
    );

    const templates = response.data.result;

    if (templates.length === 0) {
      console.log("No email templates found to delete.");
      return;
    }

    await processEmailTemplates(templates, name, tenantUrl, token);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteEmailTemplates = deleteEmailTemplates;