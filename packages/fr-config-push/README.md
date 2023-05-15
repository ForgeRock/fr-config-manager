# ForgeRock Identity Cloud Configuration

This repository contains scripts to set up and configure a ForgeRock Identity Cloud instance. All scripts are used as part of the CI/CD pipeline but can also be ran locally.

## Running Locally

### Pre-Requisites

The following need to be installed/configured for local use:

- [NodeJS](https://nodejs.org/en/download/)
- [ForgeRock Identity Cloud User](https://backstage.forgerock.com/docs/idcloud/latest/paas/tenant/postman-collection.html#preparing_your_identity_cloud)
- [ForgeRock Identity Cloud Admin OAuth Client](https://backstage.forgerock.com/docs/idcloud/latest/paas/tenant/postman-collection.html#running_the_prerequisite_steps)

### Install Dependencies

```
npm install
npm link
```

## Scripts

All scripts can also be ran locally using the CLI with the correct arguments and environment variables.

The available CLI commands can be found using the help option: `fr-config-push -h`

Each command also has its own help option, for example: `fr-config-push journeys -h`
