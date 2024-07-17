# ForgeRock Identity Cloud - Demonstration Configuration Management Tools

## Disclaimer

The sample code described herein is provided on an "as is" basis, without warranty of any kind, to the fullest extent permitted by law. ForgeRock does not warrant or guarantee the individual success developers may have in implementing the sample code on their development platforms or in production configurations. ForgeRock does not warrant, guarantee or make any representations regarding the use, results of use, accuracy, timeliness or completeness of any data or information relating to the sample code. ForgeRock disclaims all warranties, expressed or implied, and in particular, disclaims all warranties of merchantability, and warranties related to the code, or any service or software related thereto.

ForgeRock shall not be liable for any direct, indirect or consequential damages or costs of any type arising out of any action taken by you or others related to the sample code.

## Introduction

This repository includes sample javascript based tools for managing Identity Cloud configuration in an external repository. The scripts are a starting point for customers who wish to store and manage Identity Cloud configuration in their own repository and automate the export and/or import of this configuration via a CI/CD pipeline or other management framework.

In order to meet the requirements of managing ForgeRock config as code, the tools provide a view of configuration which is:

- **Complete** - a complete representation of all configuration of a tenant
- **Understandable** - all configuration should be as legible and understandable as possible.
- **Modular** - monolithic configuration is broken into its constituent parts for more granular management
- **Predictable** - order and format of configuration does not change if no changes are made.

Note that these tools are not supported by ForgeRock: they are sample code to be adapted or used as-is as part of the customer owned configuration management tooling.

If you encounter any issues or have any suggestions for improvement, please [raise an issue via the repo](https://github.com/forgerock/fr-config-manager/issues) and it will be reviewed for addition to the backlog.

If you would like to contribute to this project you can fork the repository, clone it to your machine and get started.

## Packages

This repository provides the following packages

- `fr-config-pull` - A tool to pull configuration from Identity Cloud into a local repository
- `fr-config-push` - A tool to push configuration from a local repository into Identity Cloud
- `fr-config-promote` - A tool to promote configuration from a lower tenant to a upper tenant in Identity Cloud

For full usage details, refer to the README in the respective package directories.

## Prerequisites

The tools require the following:

- Node.js
- Access to a ForgeRock Identity Cloud tenant.
- A tenant service account ID and private key.

Refer to the Identity Cloud documentation for details on how to create a service account and obtain its ID and private key.

## Installation

The `fr-config-manager` packages may be installed from source or as an `npm` package.

### Installing from source

To install from source, clone the config manager repository, checkout the latest version and build the tools

```
mkdir ~/identity-cloud
cd ~/identity-cloud
git clone https://github.com/ForgeRock/fr-config-manager.git
cd fr-config-manager
git checkout `git describe --abbrev=0`
npm i --ws
```

### Installing the package

To install using npm

```
npm i -g @forgerock/fr-config-manager
```

## Configuration

The tools are configured via the environment, either using a `.env` file in the working directory, or via corresponding environment variables. The `.env.sample` file in the root of this repository provides an example, and should be copied as `.env` to the working directory when running the tool (or used as a reference for setting environment variables).

Refer to the [configuration README](docs/environment.md) for more details.

The `.env` file includes references to additional (optional) configuration files for managing various types of dynamic configuration - i.e. configuration which differs per inidividual environment (as opposed to static configuration which is promoted as-is to all environments). Generally speaking, these configuration files inform the `fr-config-pull` tool which entities to pull, and how to templatise their config with placeholders so that the `fr-config-push` tool can create these entities in each environment. As part of the push, the placeholders are subsituted with corresponding environment variables in the `fr-config-push` working environment.

### Oauth2 agent configuration file

The OAuth2 agent configuration file contains a list of agents to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `OAUTH2_AGENTS_CONFIG` value.

Refer to the [agent configuration README](docs/agents.md) for more details.

### Authorization policy config file

The OAuth2 agent configuration file contains a list of policy sets to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `AUTHZ_POLICY_SETS_CONFIG` value.

Refer to the [policy configuration README](docs/policies.md) for more details.

### Service objects config file

The service objects configuration file contains a list of managed objects to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `SERVICE_OBJECTS_CONFIG` value.

Refer to the [configuration README](docs/service-objects.md) for more details.

### CSP overrides file

The Content Security Policy configuration file contains a JSON encoded partial CSP configuration which is merged with the full tenant configuration on pull. This enables the use of local environment variables to create a different CSP to be pushed to each environment - e.g. report-only in dev, but enforced in higher environments.

The path to this file is configured in the `.env` file (or environment directly) as the `CSP_OVERRIDES` value.

Refer to the [configuration README](docs/csp.md) for more details.

### Raw config file

The raw configuration file contains a list of individual configuration paths to pull, and is intended for pulling arbitrary configuration which is not covered by existing commands. The path to this file is configured in the `.env` file (or environment directly) as the `RAW_CONFIG` value.

Refer to the [raw config README](docs/raw.md) for more details.

## Exported configuration

The `fr-config-pull` tool exports ForgeRock configuration to the local filesystem as a set of json files in a directory structure that represents both global and realm specific configuration.

The `fr-config-push` tool imports ForgeRock configuration from the local filesystem to the ForgeRock platform: the tool expects configuration to be structured as per the `fr-config-pull` output.

Refer to the [export contents README](docs/contents.md) for more details of the configuration structure.

## Managing ESVs

Environment specific variables and secrets may be pushed via the `fr-config-push variables` and `fr-config-push secrets` option. The typical approach is to build a local configuration file for each ESV, with a placeholder for the value. The configuration file may be built automatically using the `fr-config-pull` command. On push, the value is then substituted with a local environment variable - e.g. a github secret. Refer to the [ESV README](docs/esvs.md) for more details.

## Quickstart

To get started, create a baseline repo with your initial Identity Cloud configuration as a baseline, with the following steps

- Install the `fr-config-manager` packages
- Create a base directory
- Configure the tools via an `.env` file
- Create an empty configuration repository
- Use `fr-config-pull` to populate the repository with the current tenant configuration

### Install

```
npm i -g @forgerock/fr-config-manager
```

## Create a base directory and configuration file

```
mkdir ~/identity-cloud
cd ~/identity-cloud
curl https://raw.githubusercontent.com/ForgeRock/fr-config-manager/main/.env.sample -o .env
```

### Configure

Edit the basic configuration section of the `.env` file, as per the [configuration README](docs/environment.md). For the `CONFIG_DIR` option, use the relative path of your cloned config repo - e.g. in your `.env` file:

`CONFIG_DIR=identity-cloud-config`

Configure the remaining basic settings:

- `TENANT_BASE_URL`
- `SCRIPT_PREFIXES`
- `SERVICE_ACCOUNT_ID`
- `SERVICE_ACCOUNT_KEY`

### Create a blank github repo

Create a directory corresponding to `CONFIG_DIR` in the `.env` file, and initialise as a repo

```
cd ~/identity-cloud
mkdir identity-cloud-config
cd identity-cloud-config
git init

```

### Pull config and commit

```
cd ~/identity-cloud/identity-cloud-config
git checkout -b initial-config
cd ~/identity-cloud
fr-config-pull all-static
cd ~/identity-cloud/identity-cloud-config
git add .
git commit -m "Initial config"
```

## Licence

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
