# Configuration Manager: fr-config-pull

This tool is used to pull configuration from a ForgeRock Identity Cloud tenant.

## Installation

The tool is installed from the package directory as follows

```
npm install
npm link
```

## Configuration

The tool is configured via environment variables. Copy the sample `.env` file and configure as per the instructions in the [configuration README](../docs/environment.md).

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
  fr-config-pull cors                   Get CORS configuration
  fr-config-pull csp                    Get content security policy
  fr-config-pull email-provider         Get email provider configuration
  fr-config-pull email-templates        Get email templates
  fr-config-pull endpoints              Get custom endpoints
  fr-config-pull internal-roles         Get internal roles
  fr-config-pull journeys               Get journeys
  fr-config-pull kba                    Get KBA configuration
  fr-config-pull locales                Get locales
  fr-config-pull managed-objects        Get managed objects
  fr-config-pull oauth2-agents          Get OAuth2 agents
  fr-config-pull org-privileges         Get organization privileges config
  fr-config-pull password-policy        Get password policy
  fr-config-pull remote-servers         Get remote connector servers
  fr-config-pull schedules              Get schedules
  fr-config-pull scripts                Get authentication scripts
  fr-config-pull secrets                Get secrets
  fr-config-pull secret-mappings        Get secret mappings
  fr-config-pull service-objects        Get service objects
  fr-config-pull services               Get authentication services
  fr-config-pull themes                 Get UI themes
  fr-config-pull terms-and-conditions   Get terms and conditions
  fr-config-pull test                   Test connection and authentication
  fr-config-pull ui-config              Get UI configuration
  fr-config-pull variables              Get environment specific variables

Options:
  -h, --help               Show help                                   [boolean]
  -n, --name               Specific configuration item                  [string]
  -r, --realm              Specific realm (overrides environment)       [string]
  -d, --pull-dependencies  Pull dependencies                           [boolean]
  -v, --version            Show version number                         [boolean]
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
