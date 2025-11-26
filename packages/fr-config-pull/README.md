# Configuration Manager: fr-config-pull

This tool is used to pull configuration from a ForgeRock Identity Cloud tenant.

## Installation

The tool is installed from the package directory as follows

```
npm install
npm link
```

## Configuration

The tool is configured via environment variables. Copy the sample `.env` file and configure as per the instructions in the [configuration README](../../docs/environment.md).

## Usage

Run the `fr-config-pull` tool as follows to create an export of your Identity Cloud configuration on your local workstation.

```
Usage: fr-config-pull [arguments]

Commands:
  fr-config-pull all                    Get all configuration
  fr-config-pull all-static             Get all static configuration
  fr-config-pull access-config          Get access configuration
  fr-config-pull audit                  Get audit configuration
  fr-config-pull authentication         Get authentication configuration
  fr-config-pull authz-policies         Get authorization policies
  fr-config-pull config-metadata        Show config metadata
  fr-config-pull connector-definitions  Get connector cefinitions
  fr-config-pull connector-mappings     Get connector mappings
  fr-config-pull cookie-domains         Get cookie domain config
  fr-config-pull cors                   Get CORS configuration
  fr-config-pull csp                    Get content security policy
  fr-config-pull custom-nodes           Get custom nodes
  fr-config-pull email-provider         Get email provider configuration
  fr-config-pull email-templates        Get email templates
  fr-config-pull endpoints              Get custom endpoints
  fr-config-pull iga-workflows          Get IGA workflows
  fr-config-pull internal-roles         Get internal roles
  fr-config-pull journeys               Get journeys
  fr-config-pull kba                    Get KBA configuration
  fr-config-pull locales                Get locales
  fr-config-pull managed-objects        Get managed objects
  fr-config-pull oauth2-agents          Get OAuth2 agents
  fr-config-pull org-privileges         Get organization privileges config
  fr-config-pull password-policy        Get password policy
  fr-config-pull raw                    Get raw config
  fr-config-pull remote-servers         Get remote connector servers
  fr-config-pull schedules              Get schedules
  fr-config-pull saml                   Get SAML entities
  fr-config-pull scripts                Get authentication scripts
  fr-config-pull secrets                Get secrets
  fr-config-pull secret-mappings        Get secret mappings
  fr-config-pull service-objects        Get service objects
  fr-config-pull services               Get authentication services
  fr-config-pull telemetry              Get telemetry config
  fr-config-pull themes                 Get UI themes
  fr-config-pull terms-and-conditions   Get terms and conditions
  fr-config-pull test                   Test connection and authentication
  fr-config-pull ui-config              Get UI configuration
  fr-config-pull variables              Get environment specific variables

Options:
  -h, --help                  Show help                                      [boolean]
  -n, --name                  Specific configuration item                     [string]
  -r, --realm                 Specific realm (overrides environment)          [string]
  -d, --pull-dependencies     Pull dependencies                              [boolean]
  -p, --path                  Configuration path                              [string]
  -x, --push-api-version      Configuration push API version                  [string]
  -v, --version               Show version number                            [boolean]
  -D, --debug                 Run with debug output                          [boolean]
  -R, --retries               Retry HTTP connections <n> times on failure     [number]
  -I, --retry-interval        Seconds to wait between retries                 [number]
  -m, --include-immutable     Include immutable IGA workflows                [boolean]
  -u, --custom-relationships  Pull custom relationship schema                [boolean]
  -g, --category              Category                                        [string]
```

Notes on specific options:

`fr-config-pull journeys`

The `--name` option can be used with the `journeys` command to pull a specific journey. This can only be used if a single realm is requested, either via the .env/environment setting or via the `--realm` option. For example

```
fr-config-pull journeys --name "Customer Login" --realm alpha
```

The `--pull-dependencies` option can be used with the `journeys` command to pull all scripts and inner journeys associated with each journey pulled. For example

```
fr-config-pull journeys --name "Customer Login" --realm alpha --pull-dependencies
```

`fr-config-pull csp`

The CSP configuration endpoint requires an access token with the scope `fr:idc:content-security-policy:*`,
which is not permitted for Identity Cloud service accounts as of this version of `fr-config-manager`.

Therefore, for managing CSP configuration specifically, you need to set the environment variable
`TENANT_ACCESS_TOKEN` with an access token with this scope - for example from the admin UI. Therefore
the `csp` command is not included by default for `fr-config-pull all`.

`fr-config-pull org-privileges`

The `--name` option can be used with the `org-privileges` command to pull a specific config: the valid config names are

- `alphaOrgPrivileges`
- `bravoOrgPrivileges`
- `privilegeAssignments`

`fr-config-pull raw`

The `--path` option can be used with the `raw` command to pull a specific configuration path. e.g.

```
fr-config-pull raw --path /openidm/config/authentication
```

The `--push-api-version` option is used in conjunction with the `--path` option to specify the protocol and resource versions to use for any subsequent push operations on this resource. This information is stored within the pulled config for consumption by the `fr-config-push raw` command. E.g.

```
fr-config-pull raw --path /am/json/realms/root/realms/alpha/realm-config/webhooks/test-webhook --push-api-version.protocol 2.0 --push-api-version.resource 1.0
```

If the `--path` option is not provided, then the tool pulls all config referenced in the file pointed to by the `RAW_CONFIG` environment setting.

`fr-config-pull iga-workflows`

The `--name` option may be used to specify a specific workflow by its name.

If the `--include-immutable` option is provided, then both mutable and immutable workflows are pulled. Note that immutable workflows will be skipped when performing a `fr-config-push iga-workflows`.

`fr-config-pull custom-nodes`

The `--name` option may be used to specify a specific custom node by its name.

Refer to the [custom nodes README](../../docs/custom-nodes.md) for more details on the `custom-nodes` command.

`fr-config-pull managed-objects`

The `--name` option may be used to pull a specific managed object config.

The `--custom-relationships` option is used to pull the schema for custom relationships. This enables push of custom relationships on a different target environment - i.e. when performing `fr-config-push managed-objects` the push reads the schema config stored by the pull and pushes it to the target environment.

`fr-config-pull telemetry`
Without any options, this command will pull all telemetry config from the tenant.

To pull a specific telemetry config, use the `--category` and `--name` options to specify the config to pull - e.g.

```bash
fr-config-pull telemetry --category otlp --name newrelic
```

When pulling telemetry config, any header values are returned empty. Therefore the pull command sets header values to an environment variable corresponding to the provider and header name - e.g.

```
{
  "encoding": "PROTO",
  "endpoint": "https://otlp.datadoghq.eu/v1/logs",
  "headers": {
    "dd-api-key": "${TELEMETRY_HEADER_OTLP_DATADOG_DD_API_KEY}"
  },
  "id": "datadog",
  "sources": [
    "am-authentication"
  ],
  "type": "HTTP"
}
```

This variable name must be defined in the environment before pushing the config.
