const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");

const SOCIAL_IDENTITY_PROVIDER_SERVICE = "SocialIdentityProviders";

const updateServices = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  try {
    for (const realm of JSON.parse(REALMS)) {
      console.log("updating services in realm " + realm);
      // Read JSON files
      const dir = path.join(CONFIG_DIR, `/realms/${realm}/services`);

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
          //remove _rev if present to prevent validation error
          delete serviceFile._rev;

          const requestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/services/${serviceName}`;
          await fidcRequest(requestUrl, serviceFile, token);
          console.log(`${serviceName} updated`);

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
              await fidcRequest(descendentRequestUrl, descendentFile, token);
              console.log(`${descendentId} updated`);
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
