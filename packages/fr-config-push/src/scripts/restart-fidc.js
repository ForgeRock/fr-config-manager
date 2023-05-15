const fidcGet = require("../helpers/fidc-get");
const fidcPost = require("../helpers/fidc-post");

const restartFidc = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;

  try {
    const requestUrl = `${TENANT_BASE_URL}/environment/startup`;

    const startupResponse = await fidcGet(requestUrl, token);

    if (startupResponse.restartStatus === "restarting") {
      console.error("Environment already restarting.");
      process.exit(1);
    } else {
      await fidcPost(`${requestUrl}?_action=restart`, {}, token);
      console.log("Environment restart initiated.");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = restartFidc;
