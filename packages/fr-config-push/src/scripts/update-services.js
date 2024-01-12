const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const SOCIAL_IDENTITY_PROVIDER_SERVICE = "SocialIdentityProviders";

const updateServices = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const requestedServiceName = argv[OPTION.NAME];
  const realms = argv[OPTION.REALM] ? [argv[OPTION.REALM]] : JSON.parse(REALMS);

  if (requestedServiceName) {
    if (realms.length !== 1) {
      console.error("Error: for a named  service, specify a single realm");
      process.exit(1);
    } else {
      console.log("Updating service", requestedServiceName);
    }
  } else {
    console.log("Updating services");
  }

  try {
    for (const realm of JSON.parse(REALMS)) {
      // Read JSON files
      const dir = path.join(CONFIG_DIR, `/realms/${realm}/services`);
      if (!fs.existsSync(dir)) {
        console.log(`Warning: no servcies config defined in realm ${realm}`);
        continue;
      }

      const servicesFileContent = fs
        .readdirSync(dir)
        .filter((name) => path.extname(name) === ".json") // Filter out any non JSON files
        .map((filename) =>
          JSON.parse(fs.readFileSync(path.join(dir, filename)))
        ); // Map JSON file content to an array

      // Update each service
      await Promise.all(
        servicesFileContent.map(async (serviceFile) => {
          const serviceName = serviceFile._type._id;

          if (requestedServiceName && requestedServiceName !== serviceName) {
            return;
          }
          //remove _rev if present to prevent validation error
          delete serviceFile._rev;

          const requestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/services/${serviceName}`;
          await restPut(
            requestUrl,
            serviceFile,
            token,
            "protocol=1.0,resource=1.0"
          );
          // Descendents
          const descendentsDir = `${dir}/${serviceName}`;
          if (
            serviceName === SOCIAL_IDENTITY_PROVIDER_SERVICE &&
            fs.existsSync(descendentsDir)
          ) {
            const descendentsFileContent = fs
              .readdirSync(descendentsDir)
              .filter((name) => path.extname(name) === ".json") // Filter out any non JSON files
              .map((filename) =>
                JSON.parse(fs.readFileSync(path.join(descendentsDir, filename)))
              );

            descendentsFileContent.map(async (descendentFile) => {
              // Needs fix to include blank redirectAfterFormPostURI (otherwise validation fails)
              if (!descendentFile.redirectAfterFormPostURI) {
                descendentFile.redirectAfterFormPostURI = "";
              }
              //remove _rev if present to prevent validation error
              delete descendentFile._rev;
              const descendentId = descendentFile._id;
              const descendentType = descendentFile._type._id;
              const descendentRequestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/services/${serviceName}/${descendentType}/${descendentId}`;
              await restPut(
                descendentRequestUrl,
                descendentFile,
                token,
                "protocol=2.0,resource=1.0"
              );
            });
          }
          return Promise.resolve();
        })
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateServices;
