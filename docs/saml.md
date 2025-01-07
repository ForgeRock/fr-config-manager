# SAML configuration file

The SAML configuration file contains a list of SAML entities to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `SAML_CONFIG` value.

The file contains a JSON encoded object, containing a top level property for each realm. Each realm object contains a list of SAML entity objects `samlProviders` and circles of trust `circlesOfTrust`.

SAML entity objects support a `replacements` function that replaces all occurrences of the `search` string with the `replacement` value. This is required to enable import of the same SAML provider configuration into different environemnts.

The `fileName` attribute can be used to store a SAML entity with a custom file name. This can be helpful if the entityId is a URL using the tenant base ID and changes in each environment. If no filename is given, the entityId will be used as file name with characters that are not file safe replaced by an underscore `_`.

A sample file is as follows

```
{
  "alpha": {
    "samlProviders": [
      {
        "entityId": "urn:acmecorp::my-sp"
      },
      {
        "entityId": "https://my-tenant.id.forgerock.io/alpha/exampleidp",
        "replacements": [
          {
            "search": "https://my-tenant.id.forgerock.io",
            "replacement": "${TENANT_BASE_URL}"
          }
        ],
        "fileName": "exampleidp"
      }
    ],
    "circlesOfTrust": ["EXAMPLE_COT"]
  }
}
```
