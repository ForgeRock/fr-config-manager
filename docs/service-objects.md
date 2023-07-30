# Service object configuration

The service objects configuration file contains a list of managed objects to include in per-environment configuration, such as service accounts, predefined roles or groups etc.

The path to this file is configured in the `.env` file (or environment directly) as the `SERVICE_OBJECTS_CONFIG` value.

The file contains a JSON encoded object, containing a top level property for each object type. Each object type contains a list of managed objects to pull.

Each managed object has the following properties

- `searchField` The field to use to search for the managed object
- `searchValue` The value to use to search for the managed object
- `fields` The fields to pull for the managed object
- `overrides` Fields to override with a fixed value

A sample file is as follows

```
{
  "alpha_user": [
    {
      "searchField": "userName",
      "searchValue": "service_account.journey",
      "fields": ["userName", "givenName", "sn", "mail", "authzRoles"],
      "overrides": {
        "password": "${SERVICE_ACCOUNT_JOURNEY_PASSWORD}"
      }
    },
    {
      "searchField": "userName",
      "searchValue": "service_account.ig",
      "fields": ["userName", "givenName", "sn", "mail", "authzRoles"],
      "overrides": {
        "password": "${SERVICE_ACCOUNT_ALPHA_IG_PASSWORD}"
      }
    }
  ],
  "alpha_role": [
    {
      "searchField": "name",
      "searchValue": "User Administrator",
      "fields": ["name", "description"],
      "overrides": {}
    }
  ],
  "bravo_user": [
    {
      "searchField": "userName",
      "searchValue": "service_account.ig",
      "fields": ["userName", "givenName", "sn", "mail", "authzRoles"],
      "overrides": {
        "password": "${SERVICE_ACCOUNT_BRAVO_IG_PASSWORD}"
      }
    }
  ]
}
```
