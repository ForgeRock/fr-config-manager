const {
  env
} = require("yargs");
const {
  restPost,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const POLL_INTERVAL_SECONDS = 60
async function waitForLocked(token) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;

  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const response = await restGet(
          `${envUrl}/promotion/lock/state`,
          null,
          token,
          "protocol=1.0,resource=1.0"
      );

      if (response.data.result !== "locked") {
          await sleep(POLL_INTERVAL_SECONDS * 1000);
          await waitForLocked(token);
      }
      if (response.data.result == "locked") {
          console.log(JSON.parse('{"status": "' + response.data.result + '", "Promotionid": "' + response.data.promotionId + '"}'));
      }
  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }

}

const lockTenants = async (argv, token) => {
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;

  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const lockedStateResponse = await restPost(
          `${envUrl}/promotion/lock`,
          null,
          null,
          token,
          "protocol=2.1,resource=1.0"
      );
      console.log("Waiting for tenants to lock");
      await waitForLocked(token);
  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }
};

module.exports = lockTenants;