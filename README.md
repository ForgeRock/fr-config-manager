# ForgeRock Identity Cloud - Demonstration Configuration Management Tools

<b>Note: This is an alpha release candidate: it should not be used in production in its current state.</b>

## Disclaimer

The sample code described herein is provided on an "as is" basis, without warranty of any kind, to the fullest extent permitted by law. ForgeRock does not warrant or guarantee the individual success developers may have in implementing the sample code on their development platforms or in production configurations. ForgeRock does not warrant, guarantee or make any representations regarding the use, results of use, accuracy, timeliness or completeness of any data or information relating to the sample code. ForgeRock disclaims all warranties, expressed or implied, and in particular, disclaims all warranties of merchantability, and warranties related to the code, or any service or software related thereto.

ForgeRock shall not be liable for any direct, indirect or consequential damages or costs of any type arising out of any action taken by you or others related to the sample code.

## Introduction

This repository includes sample javascript based tools for managing Identity Cloud configuration in an external repository. The scripts are a starting point for customers who wish to store and manage Identity Cloud configuration in their own repository and automate the export and/or import of this configuration via a CI/CD pipeline or other management framework.

Note that these tools are not supported by ForgeRock: they are sample code to be adapted or used as-is as part of the customer owned configuration management tooling.

## Packages

This repository provides the following packages

- `fr-config-pull` - A tool to pull configuration from Identity Cloud into a local repository
- `fr-config-push` - A tool to push configuration from a local repository into Identity Cloud

## Prerequisites

The tools require the following:

- Node.js
- Access to a ForgeRock Identity Cloud tenant.
- A tenant service account ID and private key.

Refer to the Identity Cloud documentation for details on how to create a service account and obtain its ID and private key.

## Tool Configuration

The tools are configured via the environment, either using a `.env` file in the working directory, or via corresponding environment variables. The `.env.sample` file in the root of this repository provides an example, and should be copied as `.env` to the working directory when running the tool (or used as a reference for setting environment variables).

The required environment variables are as follows

| Name                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Example                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| TENANT_BASE_URL           | ForgeRock Identity Cloud URL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `https://openam-demo-euw1-dev.id.forgerock.io`                               |
| TENANT_READONLY           | Set to `true` to prevent config push via the `fr-config-push` command (or any other tool which uses this flag). This will cause the `fr-config-push` command to return an error and exit immediately                                                                                                                                                                                                                                                                                                                           | `false`                                                                      |
| CONFIG_DIR                | Directory containing the configuration to be pushed/pulled. May be absolute path or relative to working directory                                                                                                                                                                                                                                                                                                                                                                                                              | `/var/fidc-config`                                                           |
| REALMS                    | List of realms for configuration push/pull, expressed as a JSON encoded array of strings.                                                                                                                                                                                                                                                                                                                                                                                                                                      | `["alpha","bravo"]`                                                          |
| SCRIPT_PREFIXES           | List of prefixes for retrieving scripts. Only scripts with names beginning with these prefixes will be pulled from the tenant configuration. This can be used to avoid pushing/pulling default system scripts. Note that this option is ignored by the push tool, which pushes all script configuration present in the local file system.                                                                                                                                                                                      | `["acme-corp-","widget-"]`                                                   |
| SERVICE_ACCOUNT_ID        | Identity Cloud service account ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `d9d3922b-0e77-4589-b86e-1a1446712fdf`                                       |
| SERVICE_ACCOUNT_CLIENT_ID | Tenant wide OAuth2 client ID for the service account. Normally fixed as `service-account`                                                                                                                                                                                                                                                                                                                                                                                                                                      | `service-account`                                                            |
| SERVICE_ACCOUNT_SCOPE     | OAuth2 scopes to request when acquiring an access token for the push/pull, expressed as a space delimited list of scopes. The scopes required will depend on whether performing push or pull, and which areas of tenant config to push/pull                                                                                                                                                                                                                                                                                    | `fr:idm:* fr:am:* fr:idc:esv:*`                                              |
| SERVICE_ACCOUNT_KEY       | The service account private key, expressed either as a JWK (as downloaded from the Identity Cloud admin UI) or as a PEM encoded private key.                                                                                                                                                                                                                                                                                                                                                                                   | Refer to `.env.sample` file for examples of JWK and PEM encoded private keys |
| OAUTH2_AGENTS_CONFIG      | The file path for the JSON file containing details of OAuth2 agents to pull from the Identity Cloud tenant. This is used by the `fr-config-pull oauth2-agents` command for system clients present in all environments. Note that this config is ignored by the `fr-config-push oauth2-agents` command: all agents contained in the `realm-config/agents` directory for each realm are pushed to the target tenant. Refer to the [later section](#oauth2-agent-configuration-file) for details of the file format.              | `pull-config/oauth2-agents.json`                                             |
| AUTHZ_POLICY_SETS_CONFIG  | The file path for the JSON file containing details of authorisation policy sets to pull from the Identity Cloud tenant. This is used by the `fr-config-pull authz-policies` command to selectively export policy sets. Note that this config is ignored by the `fr-config-push authz-policies` command: the tool will push all policy sets contained in the `realm-config/authorization/policy-sets` directory for each realm. Refer to the [later section](#authorization-policy-config-file) for details of the file format. | `pull-config/authz-policies.json`                                            |
| SERVICE_OBJECTS_CONFIG    | The file path for the JSON file containing details of managed objects to pull from the Identity Cloud tenant. This is used by the `fr-config-pull service-objects` command to selectively export managed users, roles etc. Note that this config is ignored by the `fr-config-push service-objects` command: the tool will push all managed objects contained in the `service-objects` directory. Refer to the [later section](#service-objects-config-file) for details of the file format.                                   | `pull-config/service-objects.json`                                           |

### Oauth2 agent configuration file

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

### Authorization policy config file

The OAuth2 agent configuration file contains a list of policy sets to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `AUTHZ_POLICY_SETS_CONFIG` value.

The file contains a JSON encoded object, containing a top level property for each realm. Each realm object contains a list of policy set names to pull.

A sample file is as follows

```
  "alpha": ["my-policy-set"],
  "bravo": []
}
```

### Service objects config file

The service objects configuration file contains a list of managed objects to pull from the Identity Cloud tenant, for subsequent push to each target environment.

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
}
```

## Configuration Repository Structure

These tools create or expect a configuration repository with the structure below. The purpose of this structure is to represent Identity Cloud configuration in a way that is suitable for management in a version control system such as git - i.e. configuration as code.

In order to meet this requirement of config as code, the structure is designed to be

- **Complete** - a complete representation of all configuration of a tenant
- **Understandable** - all configuration should be as legible and understandable as possible.
- **Modular** - monolithic configuration is broken into its constituent parts for more granular management
- **Predictable** - order and format of configuration does not change if no changes are made.

Where inline configuration is broken out into separate files, the top level configuration json is altered to use `file` instead of `source` for the content - e.g.

```
  "onCreate": {
    "globals": {},
    "type": "text/javascript",
    "source": "require('onCreateUser').setDefaultFields(object);"
  }
```

is converted to

```
  "onCreate": {
    "globals": {},
    "type": "text/javascript",
    "file": "alpha_user.onCreate.js"
  }
```

and the javascript source is moved to the corresponding file. A similar approach is taken for breaking out HTML, CSS etc.

### Realm specific configuration

The configuration repo contains the top level directory `realms` with a subdirectory for each of the realms to be pushed/pulled - `alpha` and/or `bravo`. Each realm directory has the following subdirectories:

| Directory              | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| scripts                | This directory contains one JSON file per script defined in this realm. The scripts themselves are created under `script-content/{script-type}`.                                                                                                                                                                                                                                                                                                                                                                 |
| journeys               | This contains a subdirectory `{journey-name}` for each journey configured in the realm. Each of these subdirectories contain the file `{journey-name}.json` with the overall tree configuration, together with a `nodes` subdirectory containing one file per node in the tree. Node config filenames are formatted as `{node-display-name} - {tree-node-id}.json`. In the case of Page nodes, all child nodes are contained within a subdirectory named: `{page-node-display-name} - {page-tree-node-id}.json`. |
| password&#x2011;policy | `{realm}_user-password-policy.json` contains the realm password policy                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| services               | This directory contains one file `{service-name}.json` per access management service configured in the realm.                                                                                                                                                                                                                                                                                                                                                                                                    |
| themes                 | There is one subdirectory `{theme-name}` per theme defined in the realm. Each theme directory has the file `{theme-name}.json` containing the top level theme configuration, alongside separate HTML files containing the header and footer contents.                                                                                                                                                                                                                                                            |
| secret-mappings        | There is one file `{mapping-name}.json` per secret mapping defined in each realm. These are specifically the tenant specific mappings defined ni the customer accessible `ESV` secret store.                                                                                                                                                                                                                                                                                                                     |
| authorization          | This directory contains the Authorization Policy Engine configuration. There are two subdirectories - `policy-sets` contains a subdirectory per policy set, and `resource-types` contain the authorization resource types in use by these policy sets. This directory is populated by the `fr-config-pull` tool according to the list of policy sets defined in the `.env` file.                                                                                                                                 |
| realm-config           | This directory contains the overall configuration for each realm, such as `authentication.json`, together with the subdirectory `agents` which contains the OAuth2 agents to be exported/imported for each environment. This directory is populated by the `fr-config-pull` tool, according to the list of agents defined in the `.env` file.                                                                                                                                                                    |

## Global configuration

The configuration repo contains the following directories for tenant wide configuration - i.e. non realm specific configuration:

| Directory               | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sync                    | Subdirectories as follows<ul><li>`connectors` contains the connector configuration, broken down into one JSON file per connector with the filename `{connector-name}.json`<li>`mappings` contains the sync mappings broken down into one JSON file per mapping with the filename `{mapping-name}.json`<li>`rcs` contains the remote connector server configuration `provisioner.openicf.connectorinfoprovider.json`</ul>                                                                                                                                                                                                                                                   |
| cors                    | This contains the combined CORS configuration for the tenant `cors-config.json`, with settings for both `/am` and `/openidm` endpoints                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| email&#x2011;provider   | The external email service configuration `external.email.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| email&#x2011;templates  | One subdirectory `{template-name}` per email template. Each subdirectory contains the top level template configuration `{template-name}.json`, alongside separate files for <ul><li>CSS `{template-name}.css`<li>HTML `{template-name}.{lang}.html`<li>Markdown `{template-name}.{lang}.md`.</ul>ß                                                                                                                                                                                                                                                                                                                                                                         |
| access&#x2011;config    | The authorisation configuration `access.json` for `/openidm` endpoints                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| endpoints               | A subdirectory per endpoint, each subdirectory containing a JSON file with the endpoint configuration `{endpoint-name}.json` alongside the file `{endpoint-name}.js` containing the endpoint JavaScript.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| schedules               | A subdirectory per schedule, each subdirectory containing a JSON file with the schedule configuration `{schedule-name}.json`, alongside the script file `{schedule-name}.js` where applicable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| kba                     | The Knowledge Based Authentication configuration for the tenant as a single JSON file `selfservice.kba.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| managed&#x2011;objects  | One subdirectory `{object-name}` for each managed object configured in the tenant. Each subdirectory contains a JSON file `{object-name}.json` with the top level managed object configuration, alongside a separate javascript file `{object-name}.{event-trigger}.json` for each managed object trigger script                                                                                                                                                                                                                                                                                                                                                           |
| terms&#x2011;conditions | A JSON file with the top level terms and conditions configuration `terms-conditions.json`, alongside a subdirectory `{terms-version}` for each version configured. Each subdirectory has an HTML file `{language}.html` for each language configured                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ui                      | A JSON file with the hosted UI configuration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| esvs                    | Subdirectories as follows<ul><li>`secrets`- one JSON file`{secret-name}.json` per environment secret<li>`variables`- one JSON file`{variable-name}.json`per environment variable</ul>Each JSON file has a placeholder for the`valueBase64` value. This is intended for substitution with an environment variable in the working environment of the configuration push. In the case of secrets, there are one or more versions of the secret listed in the JSON file. Each version has its own secret value: the highest version in the list will be the active version after running a push. Once the push is complete, any pre-existing versions of a secret are removed. |
| internal&#x2011;roles   | One JSON file `{role-name}.json` per authorisation role configured in the tenant. This does not include the system roles such as `openidm-admin` etc (system roles are detected and excluded based on their having no configured privileges).                                                                                                                                                                                                                                                                                                                                                                                                                              |
| service-objects         | This contains the managed objects to push to each environment - e.g. service managed users, managed roles etc. There is one directory per managed object type to be pushed: within each directory there is one JSON file for each object to create, containing the object attributes. The JSON must contain an `_id` attribute, which is used for the push so that the object is created or updated with a fixed ID.                                                                                                                                                                                                                                                       |
| locales                 | This contains the UI message strings for all locales configured in the tenant. There is one file `{locale}.json` per locale configured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| audit                   | This contains the identity management audit configuration for the tenant as a single file `audit.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## Quickstart

To get started, create a repository and pull your Identity Cloud configuration as a baseline.

### Clone the config manager repository and build the pull tool

```
mkdir ~/identity-cloud
cd ~/identity-cloud
git clone https://github.com/ForgeRock/fr-config-manager.git
cd fr-config-manager
npm install --ws
cd packages/fr-config-pull
npm link
```

### Create a blank github repo and clone

```
cd ~/identity-cloud
git clone https://github.com/my-org/identity-cloud-config

```

### Configure tenant access

```
cd ~/identity-cloud/identity-cloud-config
cp ~/fr-config-manager/.env.sample ./.env
```

Edit the `.env` file as per instructions above

### Pull config, commit and push

```
cd ~/identity-cloud/identity-cloud-config
git checkout -b initial-config
fr-config-pull
git add .
git commit -m "Initial config"
git push origin initial-config
```

### Merge

You can now create a pull request for the `initial-config` branch in github and merge.
