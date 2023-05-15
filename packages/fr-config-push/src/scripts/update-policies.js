const fs = require("fs");
const { request } = require("https");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const fidcPost = require("../helpers/fidc-post");
const fidcGet = require("../helpers/fidc-get");

function clearOperationalAttributes(obj) {
  delete obj._id;
  delete obj._rev;
  delete obj.createdBy;
  delete obj.creationDate;
  delete obj.lastModifiedBy;
  delete obj.lastModifiedDate;
}

async function alreadyExists(requestUrl, accessToken) {
  var exists = false;
  try {
    const response = await fidcGet(requestUrl, accessToken);
    exists = true;
  } catch (e) {}
  return exists;
}

async function upsertResource(
  path,
  resourceName,
  resourceObject,
  apiVersion,
  token
) {
  const requestUrl = `${path}/${encodeURIComponent(resourceName)}`;

  if (await alreadyExists(requestUrl, token)) {
    console.log("Updating resource");
    await fidcRequest(requestUrl, resourceObject, token, apiVersion);
  } else {
    console.log("Creating resource");
    await fidcPost(`${path}?_action=create`, resourceObject, token, apiVersion);
  }
}

const updateAuthzPolicies = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;
  for (const realm of JSON.parse(REALMS)) {
    console.log("Updating authz policies in realm " + realm);

    try {
      const baseDir = path.join(CONFIG_DIR, `/realms/${realm}/authorization`);
      if (!fs.existsSync(baseDir)) {
        continue;
      }

      const resourceTypesDir = path.join(baseDir, "resource-types");
      if (fs.existsSync(resourceTypesDir)) {
        const resourceTypes = fs.readdirSync(resourceTypesDir);
        for (const resourceType of resourceTypes) {
          const resourceTypeObject = JSON.parse(
            fs.readFileSync(path.join(resourceTypesDir, resourceType))
          );

          resourceTypeObject.uuid = resourceTypeObject._id;
          delete resourceTypeObject._id;

          clearOperationalAttributes(resourceTypeObject);

          const resourcePath = `${TENANT_BASE_URL}/am/json/${realm}/resourcetypes`;
          await upsertResource(
            resourcePath,
            resourceTypeObject.uuid,
            resourceTypeObject,
            "protocol=1.0,resource=1.0",
            token
          );
        }
      }

      const policySetsDir = path.join(baseDir, "policy-sets");
      if (fs.existsSync(policySetsDir)) {
        const policySetDirs = fs.readdirSync(policySetsDir);
        for (const policySetDir of policySetDirs) {
          console.log("Updating policy set", policySetDir);
          const policySetObject = JSON.parse(
            fs.readFileSync(
              path.join(policySetsDir, policySetDir, `${policySetDir}.json`)
            )
          );

          clearOperationalAttributes(policySetObject);

          const resourcePath = `${TENANT_BASE_URL}/am/json/${realm}/applications`;

          await upsertResource(
            resourcePath,
            policySetObject.name,
            policySetObject,
            "protocol=1.0,resource=2.0",
            token
          );

          const policiesDir = path.join(
            policySetsDir,
            policySetDir,
            "policies"
          );
          if (fs.existsSync(policiesDir)) {
            const policyFiles = fs.readdirSync(policiesDir);
            for (const policyFile of policyFiles) {
              const policyObject = JSON.parse(
                fs.readFileSync(path.join(policiesDir, policyFile))
              );

              console.log("Updating policy", policyObject.name);

              clearOperationalAttributes(policyObject);

              const resourcePath = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/policies`;

              await upsertResource(
                resourcePath,
                policyObject.name,
                policyObject,
                "protocol=1.0,resource=2.0",
                token
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

module.exports = updateAuthzPolicies;
