const { restPost } = require("../../../fr-config-common/src/restClient");
const { OPTION } = require("../helpers/cli-options");

const rollbackPromotion = async (argv, token) => {
  const { TENANT_ENV_UPPER_FQDN } = process.env;

  const unlockEnvironmentsAfterPromotion = argv[OPTION.UNLOCK_AFTER]
    ? true
    : false;

  const promoter = argv[OPTION.PROMOTER];
  const promotionDescription = argv[OPTION.PROMOTION_DESCRIPTION];
  const zendeskTicketReference = argv[OPTION.TICKET_REFERENCE];

  try {
    const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
    let body = {
      unlockEnvironmentsAfterPromotion: unlockEnvironmentsAfterPromotion,
    };

    if (promoter) {
      body.promoter = promoter;
    }
    if (promotionDescription) {
      body.promotionDescription = promotionDescription;
    }
    if (zendeskTicketReference) {
      body.zendeskTicketReference = zendeskTicketReference;
    }

    const response = await restPost(
      `${envUrl}/promotion/rollback`,
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

module.exports = rollbackPromotion;
