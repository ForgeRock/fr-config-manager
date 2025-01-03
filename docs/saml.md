# SAML configuration file

The SAML configuration file contains a list of SAML entities to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `SAML_CONFIG` value.

The file contains a JSON encoded object, containing a top level property for each realm. Each realm object contains a list of SAML entity objects `samlProvicdes` and circles of trust `circlesOfTrust`.

SAML entity objects support a `replacements` function that replaces all occurences of the `search` string with the `replacement` value. This is required to enable import of the same SAML provider configuration into different environemnts

A sample file is as follows

```
{
  "alpha": {
    "samlProviders": [
      {
        "entityId": "MY-SP"
      },
      {
        "entityId": "MY-IDP",
        "replacements": [
          {
            "search": "https://my-tenant.id.forgerock.io",
            "replacement": "${TENANT_BASE_URL}"
          }
        ]
      }
    ],
    "circlesOfTrust": ["FR-KS", "ICR_Federation_CoT"]
  }
}
```
