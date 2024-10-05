const {
  env
} = require("yargs");
const {
  restDelete,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const {
  OPTION
} = cliUtils;
const POLL_INTERVAL_SECONDS = 60
async function waitForUnLocked(token) {
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
      if (response.data.result !== "unlocked") {
          await sleep(POLL_INTERVAL_SECONDS * 1000);
          await waitForUnLocked(token);
      }
      if (response.data.result == "unlocked") {
          console.log(JSON.stringify({ status: response.data.result },null,4));
      }
  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }

}

const unlockTenants = async (argv, token) => {
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;
  const promotionID = argv[OPTION.ID];
  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const unlockedStateResponse = await restDelete(
          `${envUrl}/promotion/lock/${promotionID}`,
          token,
          "protocol=2.1,resource=1.0"
      );
      console.log("Waiting for tenants to unlock");
      await waitForUnLocked(token);

  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }
};

module.exports = unlockTenants;
