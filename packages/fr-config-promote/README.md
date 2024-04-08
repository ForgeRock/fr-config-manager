# Configuration Manager: fr-config-promote

This tool is used to promote configuration from the one ForgeRock Identity Cloud tenant to the other ForgeRock Identity Cloud tenant.
## Installation

The tool is installed from the package directory as follows

```
npm install
npm link
```

## Configuration

The tool is configured via environment variables. Copy the sample `.env` file and configure as per the instructions in the [configuration README](../docs/environment.md).

## Usage

Run the `fr-config-promote` tool as follows to promote configuration from the one ForgeRock Identity Cloud tenant to the other ForgeRock Identity Cloud tenant.

```
Usage: fr-config-promote [arguments]

Commands:
  fr-config-promote check-locked-status       Checks tenants to see if it is locked
  fr-config-promote lock-tenants              Lock tenants
  fr-config-promote unlock-tenants            Unlock tenants
  fr-config-promote check-promotion-status    Check Promotion Status
  fr-config-promote run-dryrun-promotion      Run DryRun Promotion
  fr-config-promote run-promotion             Run Promotion
  fr-config-promote check-promotion-reports   check promotion reports

Options:
  -h, --help     Show help                                             [boolean]
  -v, --version  Show version number                                   [boolean]
Options:
  -h, --help               Show help                                   [boolean]
  -l, --list               list                                        [string]
  -i, --id                 id                                          [string]
  -r, --reportid           Report id                                   [string]
  -v, --version            Show version number                         [boolean]
```

Notes on specific options:

`fr-config-promote check-promotion-reports`

The `--list` option can be used with the `check-promotion-reports` command to list all the promotion reports. 

```
fr-config-promote check-promotion-reports --list 
```

The `--reportID` option can be used with the `check-promotion-reports` command to view a specific report.

```
fr-config-promote check-promotion-reports --id "bb96cada-aeca-4c75-bede-5e1e3258b5bb"
```
