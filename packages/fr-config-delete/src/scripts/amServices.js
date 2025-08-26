const { restGet, restPost, restDelete } = require("../../../fr-config-common/src/restClient.js");

const EXCLUDE_SERVICES = ["DataStoreService"];
const SOCIAL_IDENTITY_PROVIDER_SERVICE = "SocialIdentityProviders";

const API_VERSION = "protocol=2.0,resource=1.0";

async function deleteDescendents(amEndpoint, serviceName, token, dryRun) {
  const socialServiceEndpoint = `${amEndpoint}/${serviceName}`;

  const response = await restPost(
    socialServiceEndpoint,
    {
      _action: "nextdescendents",
    },
    null,
    token,
    "protocol=1.0,resource=1.0"
  );

  const descendents = response.data.result;

  for (const descendent of descendents) {

    const descendentName = descendent._id;

    // need to retrieve type (oauth2Config or oidcConfig) when deleting e.g
    // /SocialIdentityProviders/oauth2Config/<name>
    const descendentType = descendent._type._id;

    if (dryRun) {
      console.log(`Dry run: Deleting Social Identity Provider instance: ${descendentName}`);
      continue;
    }

    try {
      await restDelete(`${socialServiceEndpoint}/${descendentType}/${descendentName}`, token, API_VERSION, true);
      console.log(`Deleting Social Identity Provider: ${descendentName}`);
    } catch (err) {
      console.error(`Failed to delete Social Identity Provider ${descendentName}:`, err);
    }
  }
}

async function deleteAmServices(tenantUrl, realms, name, token, dryRun) {

  let matchFound = false;
  try {
    for (const realm of realms) {

      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/services`;

      const response = await restGet(
        amEndpoint,
        {
          _queryFilter: "true",
        },
        token
      );

      const services = response.data.result;

      for (const service of services) {
        const serviceName = service._id;
        if (
          EXCLUDE_SERVICES.includes(serviceName) ||
          (name && name !== serviceName)
        ) {
          continue;
        }

        matchFound = true;

        // Handle the deletion of Social Identity Providers separately, by deleting children first
        if (serviceName === SOCIAL_IDENTITY_PROVIDER_SERVICE) {
          await deleteDescendents(amEndpoint, serviceName, token, dryRun);
        } else {
          try {
            if (dryRun) {
              console.log(`Dry run: Deleting service ${serviceName}`);
              continue;
            }
            await restDelete(`${amEndpoint}/${serviceName}`, token, API_VERSION, true);
            console.log(`Deleting service: ${serviceName}`);
          } catch (err) {
            console.error(`Failed to delete service ${serviceName}:`, err);
          }
        }
      }

      if (name && !matchFound) {
        console.log(`Warning: Service '${name}' not found.`);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteAmServices = deleteAmServices;