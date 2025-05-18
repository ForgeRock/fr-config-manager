const { restPost } = require("../../../fr-config-common/src/restClient");
const { OPTION } = require("../helpers/cli-options");

const runPromotion = async (argv, dryRun, token) => {
  const { TENANT_ENV_UPPER_FQDN } = process.env;
  const ignoreEncryptedSecrets = argv[OPTION.IGNORE_ENCRYPTED_SECRETS]
    ? true
    : false;

  try {
    const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
    const body = {
      dryRun: dryRun,
      ignoreEncryptedSecrets: ignoreEncryptedSecrets,
    };
    const response = await restPost(
      `${envUrl}/promotion/promote`,
      null,
      body,
      token,
      "protocol=2.1,resource=1.0"
    );

    console.log(JSON.stringify(response.data, null, 4));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = runPromotion;
