# Agent configuration file

The OAuth2 agent configuration file contains a list of agents to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `OAUTH2_AGENTS_CONFIG` value.

The file contains a JSON encoded object, containing a top level property for each realm. Each realm object contains a map of agent types and their respective client instances.

A sample file is as follows

```
{
  "alpha": {
    "IdentityGatewayAgent": [
      {
        "id": "my-ig-agent",
        "overrides": {
          "userpassword": "${IG_AGENT_PASSWORD}"
        }
      }
    ],
    "OAuth2Client": [
      {
        "id": "my-policy-client",
        "overrides": {
          "userpassword": "${MY_CLIENT_SECRET}"
        }
      }
    ],
    "RemoteConsentAgent": [
      {
        "id": "my-rcs",
      }
    ],
    "SoftwarePublisher": [
      {
        "id": "My Publisher",
        "overrides": {
          "jwksUri": {
            "inherited": false,
            "value": "${MY_PUBLISHER_JWKS_URI}"
          }
        }
      }
    ],
    "J2EEAgent": [
      {
        "id": "my-java-agent",
        "overrides": {
          "userpassword": "${MY_JAVA_AGENT_PASSWORD}"
        }
      }
    ],
    "WebAgent": [
      {
        "id": "my-web-agent",
        "overrides": {
          "userpassword": "${MY_WEB_AGENT_PASSWORD}"
        }
      }
    ]
  },
  "bravo": {}
}

```

Each client level entry has the following properties:

- id: the client name
- overrides: a list of properties to override in the saved client config when pulled. Note that each property you override will be overridden in full - i.e. will not be merged with the value for the top level property from the pull.

The `overrides` section can be used to replace environment specific and sensitive values with an environment placeholder. These placeholders will be substited by the corresponding environment variables in the push environment.
