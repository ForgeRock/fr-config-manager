const {
  restGet,
  restPost,
} = require("../../../fr-config-common/src/restClient");

const restartFidc = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;

  try {
    const requestUrl = `${TENANT_BASE_URL}/environment/startup`;

    const startupResponse = await restGet(
      requestUrl,
      null,
      token,
      "protocol=1.0,resource=1.0"
    );

    if (startupResponse.restartStatus === "restarting") {
      console.error("Environment already restarting.");
      process.exit(1);
    } else {
      await restPost(
        requestUrl,
        { _action: "restart" },
        null,
        token,
        "protocol=1.0,resource=1.0"
      );
      console.log("Environment restart initiated.");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = restartFidc;
