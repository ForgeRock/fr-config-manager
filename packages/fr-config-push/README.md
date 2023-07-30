# Configuration Manager: fr-config-push

This tool is used to push configuration from the local host to your ForgeRock Identity Cloud tenant.

## Installation

The tool is installed from the package directory as follows

```
npm install
npm link
```

## Configuration

The tool is configured via environment variables. Copy the sample `.env` file and configure as per the instructions in the [configuration README](../docs/environment.md).

## Usage

Run the `fr-config-push` tool as follows to push configuration from the local host to your Identity Cloud tenant.

```
Usage: fr-config-push [arguments]

Commands:
  fr-config-push journeys               Update Authentication Journeys
  fr-config-push connector-definitions  Update Connector Definitions
  fr-config-push connector-mappings     Update Connector Mappings
  fr-config-push cors                   Update ForgeRock CORS
  fr-config-push managed-objects        Update Managed Objects
  fr-config-push email-templates        Update Email Templates
  fr-config-push themes                 Update Hosted UI Themes
  fr-config-push remote-servers         Update Remote Connector Servers
  fr-config-push scripts                Update Scripts
  fr-config-push services               Update Services
  fr-config-push realm-config           Update Realm Config
  fr-config-push terms-and-conditions   Update Terms and Conditions
  fr-config-push password-policy        Update Password Policy
  fr-config-push ui-config              Update UI config
  fr-config-push endpoints              Update Custom Endpoints
  fr-config-push schedules              Update Schedules
  fr-config-push access-config          Update Access Configuration
  fr-config-push kba                    Update KBA Configuration
  fr-config-push secret-mappings        Update Secret Mappings
  fr-config-push oauth2-agents          Update OAuth2 Agents
  fr-config-push authz-policies         Update Authorization Policies
  fr-config-push email-provider         Update email provider settings
  fr-config-push internal-roles         Update internal roles
  fr-config-push secrets                Update secrets
  fr-config-push variables              Update environment specific variables
  fr-config-push restart                Restart tenant
  fr-config-push service-objects        Update service objects
  fr-config-push locales                Update locales
  fr-config-push audit                  Update audit configuration
  fr-config-push all-static             Update Static Configuration

Options:
  -h, --help               Show help                                   [boolean]
  -n, --name               Specific config                              [string]
  -r, --realm              Specific realm (overrides environment)       [string]
  -d, --push-dependencies  Push dependencies                           [boolean]
  -f, --filenameFilter     Filename filter                              [string]
```

Notes on specific options:

`fr-config-push journeys`

The `--name` option can be used with the `journeys` command to push a specific journey. This can only be used if a single realm is requested, either via the .env/environment setting or via the `--realm` option. For example

```
fr-config-push journeys --name "Customer Login" --realm alpha
```

The `--push-dependencies` option can be used with the `journeys` command to push all scripts and inner journeys associated with each journey pushed. For example

```
fr-config-push journeys --name "Customer Login" --realm alpha --push-dependencies
```

If you don't use the `--name` option, then inner journeys are pushed by default (but the `--push-dependencies` option is still required in order to push dependent scripts along with journeys).
