# Raw configuration

The raw configuration file contains a list of individual configuration paths to pull. The path to this file is configured in the `.env` file (or environment directly) as the `RAW_CONFIG` value.

The file contains a JSON encoded object, consisting of an array of configurations to pull. Each configuration element has the following properties:

- `path` Mandatory - the URL path for the configuration object, relative to the tenant base URL
- `overrides` Optional - a partial configuration object which should override the corresponding properties of the object pulled from the tenant. This allows insertion of placeholder values for subsequent push operations
- `pushApiVersion` Optional - an object containing the properties `protocol` and `resource` to be used in the API version header for subsequent push operations. This allows specific values for specific configuration. The default is `{ protocol: "2.0". resource: "1.0" }`. Only used for configuration under `/am`

A sample file is as follows

```
[
  { "path": "/openidm/config/authentication" },
  {
    "path": "/am/json/realms/root/realms/alpha/realm-config/webhooks/test-webhook",
    "overrides": { "url": "${TEST_WEBHOOK_URL}" },
    "pushApiVersion": {
      "protocol": "2.0",
      "resource": "1.0"
    }
  }
]
```
