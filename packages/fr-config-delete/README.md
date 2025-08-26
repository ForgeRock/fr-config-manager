# Configuration Manager: fr-config-delete

This tool is used to delete configuration from a PingOne Advanced Identity Cloud tenant.

## Installation

The tool is installed from the package directory as follows

```bash
npm install
npm link
```

## Configuration

The tool is configured via environment variables. Copy the sample `.env` file and configure as per the instructions in the [configuration README](../docs/environment.md).

## Usage

Run the `fr-config-delete` tool as follows to create an export of your Identity Cloud configuration on your local workstation.

```bash
Usage: fr-config-delete [arguments]

Commands:
  fr-config-delete test      Test authentication
  fr-config-delete journeys  Delete a journey
  fr-config-delete scripts           Delete scripts
  fr-config-delete services          Delete authentication services
  fr-config-delete cors              Delete cors
  fr-config-delete secret-mappings   Delete secret mappings
  fr-config-delete connectors        Delete connector cefinitions
  fr-config-delete mappings          Delete connector mappings
  fr-config-delete endpoints         Delete custom endpoints
  fr-config-delete remote-servers    Delete remote connector servers
  fr-config-delete schedules         Delete schedules
  fr-config-delete terms-conditions  Delete terms and conditions
  fr-config-delete locales           Delete locales
  fr-config-delete email-provider    Delete email provider configuration
  fr-config-delete email-templates   Delete email templates
  fr-config-delete themes            Delete themes
  fr-config-delete variables         Delete environment specific variables
  fr-config-delete secrets           Delete secrets
  fr-config-delete internal-roles    Delete internal roles
  fr-config-delete tenant-config     Delete tenant config
  fr-config-delete all-static        Delete static configuration
Options:
  -h, --help     Show help                                             [boolean]
  -v, --version  Show version number                                   [boolean]
```

Notes on specific options:

`fr-config-delete journeys`
Without any further arguments, the command will delete all journeys in the configured realms. When deleting all journeys, a final cleanup delete any nodes that are left over to ensure a completely clean tenant.

The `--name` option can be used with the `journeys` command to delete a specific journey. This can only be used if a single realm is requested, either via the .env/environment setting or via the `--realm` option. For example

```bash
fr-config-delete journeys --name "Customer Login" --realm alpha
```

The `--delete-inner-journeys` option can be used with the `journeys` command to delete all inner journeys associated with the journey pulled. It can only be used together with the --name option. For example

```bash
fr-config-delete journeys --name "Customer Login" --realm alpha --delete-inner-journeys
```

The `--dry-run` option can be used with the command to see what would be deleted. It can be combined with any of the other options

```bash
fr-config-delete journeys --dry-run
Deleting all journeys
Dry run: Deleting journey ResetPassword
Dry run: Deleting node 06c97be5-7fdd-4739-aea1-ecc7fe082865 of type EmailSuspendNode
Dry run: Deleting node 21b8ddf3-0203-4ae1-ab05-51cf3a3a707a of type IdentifyExistingUserNode
Dry run: Deleting node 989f0bf8-a328-4217-b82b-5275d79ca8bd of type PatchObjectNode
Dry run: Deleting node cc3e1ed2-25f1-47bf-83c6-17084f8b2b2b of type PageNode
Dry run: Deleting node e4c752f9-c625-48c9-9644-a58802fa9e9c of type PageNode
Dry run: Deleting journey Login
Dry run: Deleting node 1578396c-1ce3-4a29-be1d-f00182c147e5 of type RetryLimitDecisionNode
Dry run: Deleting node 4d6b2f38-17dc-4450-84cf-b9e755f3076d of type IncrementLoginCountNode
Dry run: Deleting node 5350a2bd-3dbe-46e5-97f8-b3aca79d679e of type InnerTreeEvaluatorNode
Dry run: Deleting node 81e4b33d-1d7b-405c-92d3-b00ad1bca881 of type PageNode
Dry run: Deleting node 89366af6-d2fd-4a8e-bb77-e04eb0e636ef of type AccountLockoutNode
Dry run: Deleting node eeed8849-add6-4188-b5f8-ba1fe9b46556 of type IdentityStoreDecisionNode
```