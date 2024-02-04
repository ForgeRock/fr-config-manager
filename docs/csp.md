# CSP overrides file

The Content Security Policy overrides file contains a partial CSP configuration object in JSON format. This is merged with the tenant CSP configuration on pull. This enables the use of placeholders in the pulled config, which can subsequently be replaced with environment specific values on push, via variables set in the local working environment of the push tool.

The path to this file is configured in the `.env` file (or environment directly) as the `CSP_OVERRIDES` value.

Note that the pulled config is the combined `enforced` and `report-only` CSP configuration.

A sample overrides file is as follows

```
{
  "enforced": {
    "active": {
      "$bool": "${CSP_ENFORCED}"
    }
  },
  "report-only": {
    "active": {
      "$bool": "${CSP_REPORT_ONLY}"
    }
  }
}
```
