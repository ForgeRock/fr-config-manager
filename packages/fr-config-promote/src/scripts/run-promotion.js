const {
  env
} = require("yargs");
const {
  restPost,
} = require("../../../fr-config-common/src/restClient");

const runPromotion = async (argv, token) => {
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;

  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const dryRunJSON = {
          "dryRun": false
      };
      const response = await restPost(
          `${envUrl}/promotion/promote`,
          null,
          dryRunJSON,
          token,
          "protocol=2.1,resource=1.0"
      );

      console.log(JSON.stringify(response.data,null,4));

  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }
};

module.exports = runPromotion;
