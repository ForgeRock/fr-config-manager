const fs = require("fs");

const manageRestartFidcFileMarker = (restartRequired) => {
  const restartRequiredFilename = "FIDC_RESTART_REQUIRED.txt";

  try {
    if (restartRequired) {
      console.log(
        "\n** FIDC RESTART REQUIRED ** (marker file '" +
          restartRequiredFilename +
          "' created)\n"
      );

      if (!fs.existsSync(restartRequiredFilename)) {
        fs.closeSync(fs.openSync(restartRequiredFilename, "w"));
      }
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = manageRestartFidcFileMarker;
