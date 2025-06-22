const COMMON_OPTIONS = {
  DEBUG: "debug",
  RETRIES: "retries",
  RETRY_INTERVAL: "retry-interval",
  DRY_RUN: "dry-run",
};

const COMMON_CLI_OPTIONS = {
  debug: {
    alias: "D",
    type: "boolean",
    description: "Run with debug output",
  },
  retries: {
    alias: "R",
    type: "number",
    description: "Retry HTTP connections <n> times on on failure",
  },
  "retry-interval": {
    alias: "I",
    type: "number",
    description: "Seconds to wait between retries",
  },
  "dry-run": {
    alias: "Y",
    type: "boolean",
    description: "Dry run for REST requests",
  },
};

function getOption(name) {
  const option = COMMON_CLI_OPTIONS[name];
  if (!option) {
    console.error(`Unrecognized option "${name}"`);
    process.exit(1);
  }

  const longForm = `--${name}`;
  const shortForm = `-${option.alias}`;

  const findOptionIndex = () => {
    const longIndex = process.argv.indexOf(longForm);
    const shortIndex = process.argv.indexOf(shortForm);
    return longIndex !== -1 ? longIndex : shortIndex;
  };

  const index = findOptionIndex();

  switch (option.type) {
    case "boolean":
      return index !== -1;
    case "number":
      if (index !== -1 && process.argv[index + 1]) {
        const value = parseInt(process.argv[index + 1], 10);
        if (!isNaN(value)) return value;
      }
      return null;
    case "string":
      if (index !== -1 && process.argv[index + 1]) {
        return process.argv[index + 1];
      }
      return null;
  }

  console.error(`Missing or invalid value for option "${name}"`);
  process.exit(1);
}

module.exports.COMMON_OPTIONS = COMMON_OPTIONS;
module.exports.COMMON_CLI_OPTIONS = COMMON_CLI_OPTIONS;
module.exports.getOption = getOption;
