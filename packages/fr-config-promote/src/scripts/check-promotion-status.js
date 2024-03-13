const {
  env
} = require("yargs");
const {
  restGet,
} = require("../../../fr-config-common/src/restClient");

const checkPromotionStatus = async (argv, token) => {
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;

  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const lockedStateResponse = await restGet(
          `${envUrl}/promotion/promote`,
          null,
          token,
          "protocol=1.0,resource=1.0"
      );

      console.log(lockedStateResponse.data);

  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }
};

module.exports = checkPromotionStatus;