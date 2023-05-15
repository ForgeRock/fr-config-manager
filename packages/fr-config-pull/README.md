# FIDC Config Manager

## Preparation

```
npm install
```

## Build

```
npm link
```

## Use

Create a .env file from the sample

```
cp .env.sample .env
```

Edit the .env file with your tenant values - refer to the main READNE for details.

Run a pull of all or selected config:

```
Usage: fr-config-pull [arguments]

Commands:
  fr-config-pull all                    Get all configuration
  fr-config-pull journeys               Get journeys
  fr-config-pull connector-definitions  Get Connector Definitions
  fr-config-pull connector-mappings     Get Connector Mappings
  fr-config-pull cors                   Get CORS definitions
  fr-config-pull managed-objects        Get Managed Objects
  fr-config-pull email-templates        Get email templates
  fr-config-pull themes                 Get themes
  fr-config-pull remote-servers         Get Remote Connector Servers
  fr-config-pull scripts                Get Auth Scripts
  fr-config-pull services               Get Auth Services
  fr-config-pull terms-and-conditions   Get Terms and Conditions
  fr-config-pull password-policy        Get Password Policy
  fr-config-pull ui-config              Get UI config
  fr-config-pull endpoints              Get Custom Endpoints
  fr-config-pull schedules              Get Schedules
  fr-config-pull access-config          Update Access Configuration
  fr-config-pull kba                    Get KBA Configuration
  fr-config-pull secret-mappings        Get secret mappings
  fr-config-pull oauth2-agents          Get OAuth2 Agents
  fr-config-pull authz-policies         Get Authorization Policies
  fr-config-pull email-provider         Get email provider settings
  fr-config-pull realm-config           Get realm config
  fr-config-pull internal-roles         Get internal roles
  fr-config-pull secrets                Get secrets
  fr-config-pull variables              Get environment specific variables

Options:
  -h, --help  Show help                                                [boolean]
```

This will create the directory `${CONFIG_DIR}` containing the exported config.
