const { describe } = require("yargs");

const OPTION = {
  ID: "id",
  PROMOTE_DEPENDENCIES: "promote-dependencies",
  LIST: "list",
  REPORTID: "reportID",
  IGNORE_ENCRYPTED_SECRETS: "ignore-encrypted-secrets",
  LOCAL_LOCK_ONLY: "local-lock-only",
  PROMOTER: "promoter",
  PROMOTION_DESCRIPTION: "description",
  UNLOCK_AFTER: "unlock-after",
  TICKET_REFERENCE: "ticket-reference",
  PROVISIONAL: "provisional",
  PROVISIONAL_ROLLBACK: "provisional-rollback",
};

const CLI_OPTIONS = {
  id: {
    alias: "i",
    describe: "ID",
    type: "string",
    demandOption: true,
  },
  list: {
    alias: "l",
    describe: "list",
    type: "boolean",
  },
  reportID: {
    alias: "r",
    describe: "Report ID",
    type: "string",
  },
  "ignore-encrypted-secrets": {
    alias: "e",
    describe: "Ignore encrypted secrets",
    type: "boolean",
  },
  "local-lock-only": {
    alias: "o",
    describe: "Only show lock status of requested environment",
    type: "boolean",
  },
  promoter: {
    alias: "p",
    describe: "Name of promotion initiator",
    type: "string",
  },
  description: {
    alias: "c",
    describe: "Description",
    type: "string",
  },
  "unlock-after": {
    alias: "u",
    describe: "Unlock after successful promotion",
    type: "boolean",
  },
  "ticket-reference": {
    alias: "t",
    describe: "Ticket reference",
    type: "string",
  },
  provisional: {
    alias: "x",
    describe: "Provisional report",
    type: "boolean",
  },
  "provisional-rollback": {
    alias: "y",
    describe: "Provisional rollback report",
    type: "boolean",
  },
};

const cliOptions = (requestedOptions) => {
  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: CLI_OPTIONS[curr] }),
    {}
  );
};

module.exports.cliOptions = cliOptions;
module.exports.OPTION = OPTION;
