const { env } = require("yargs");
const { restGet } = require("../../../fr-config-common/src/restClient");
const { OPTION } = require("../helpers/cli-options");

const checkTenantsLocked = async (argv, token) => {
  const { TENANT_ENV_UPPER_FQDN } = process.env;

  const localLockOnly = argv[OPTION.LOCAL_LOCK_ONLY] ? "true" : "false";

  try {
    const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
    const lockedStateResponse = await restGet(
      `${envUrl}/promotion/lock/state?localLockOnly=${localLockOnly}`,
      null,
      token,
      "protocol=1.0,resource=1.0"
    );

    console.log(JSON.stringify(lockedStateResponse.data, null, 4));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = checkTenantsLocked;
