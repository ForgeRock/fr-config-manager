# Environment secrets and variables

Environment secrets and variables (ESVs) are managed in slightly different ways.

Variables are configured with a single value, which can be read and writen directly via the ESV API. Secrets can have multiple simultaneous values, one of which is active at any given time. Secrets may be set via the ESV API, but cannot be directly read via the API.

After updating variables or secrets, the tenant needs to be restarted for the new value to take effect. This can be done via the `fr-config-push restart` command.

## Variables

The `fr-config-pull variables` command reads the variables currently defined in the tenant, and creates a configuration file for each variable in the local directory `esvs/variables`. The value of the variable is substituted with a placeholder to represent a local environment variable - e.g.

```
{
  "_id": "esv-ldap-port",
  "description": "LDAP connector port number",
  "expressionType": "int",
  "valueBase64": "${ESV_LDAP_PORT}"
}
```

The `fr-config-push variables` command will replace the placeholder with the value of the local environment variable. This may be defined in the `.env` file, or in environment variables such as a git variable or other pipeline framework. Note that the value of the local variable is assumed to be unencoded - i.e. not base64 encoded. The value is encoded automatically during the push. This behaviour may be overidden by adding the prefix `BASE64:` to the placeholder name. This may be useful for pipeline frameworks where complex values such as PEM encoded certificates cause issues with environment secrets. For example, the following configuration will upload the value without performing base64 encoding:

```
{
  "_id": "esv-oidc-signer",
  "description": "OIDC token signing certificate and private key",
  "encoding": "pem",
  "useInPlaceholders": true,
  "valueBase64": "${BASE64:ESV_OIDC_SIGNER}"
}
```

If there is no corresponding local environment variable, the push command fails.

The current value of the variable in the tenant is checked first, and the variable is not updated if it matches the local variable value. This is to avoid unnecessary updates and consequent tenant restarts. The `fr-config-push variables --force` option overrides this behaviour by updating the variable without checking its value first.

The `fr-config-pull variables --dump` option will log all variables and their values to the console to help with defining the local environment variables required for the push.

## Secrets

The `fr-config-pull secrets` commands reads the secrets currently defined in the tenant, and creates a configuration file for each secret in the local directory `esvs/secrets`. The format of the configuration file is similar to the configuration file created for variables, but varies depending on the options used.

TL;DR: add `ACTIVE_ONLY_SECRETS=true` to your .env file, and run `fr-config-pull secrets` to build your local secrets directory. For each file in the directory, check the placeholder in the `valueBase64` property and add a corresponding line to your .env to specify the value. You are now ready to set secrets by running `fr-config-push secrets` against each environment.

### Active only version

If using the option `fr-config-pull secrets --active-only` the configuration file is built with a placeholder for a single value as per the variable configuration file - e.g.

```
{
  "_id": "esv-my-secret",
  "description": "",
  "encoding": "generic",
  "useInPlaceholders": true,
  "valueBase64": "${ESV_MY_SECRET}"
}
```

The `--active-only` option is the default behaviour if the configuration environment variable `ACTIVE_ONLY_SECRETS` is set to `true`.

On push, the placeholder is replaced with the value of the corresponding local environment variable. This may be defined in the `.env` file, or in an environment variable such as a git secret or other pipeline framework. The value is expected to be unencoded - i.e. not base64 encoded. The value is automatically encoded during the push.

The push checks whether the current value of the secret in the tenant matches the value value of the local variable, and only updates the secret in the tenant if it is different. On update, this creates a new version of the secret, which is then set as the active version. This means that versions will build up over time as they are changed.

### Multiple versions

If using `fr-config-pull secrets` without the `--active-only` flag, the configuration file is created with a `versions` property instead of the `valueBase64` property above. The `versions` property contains an array of versions, one for each version currently defined in the tenant. Note that the version numbers start at `1` regardless of the actual version numbers in the tenant. For each version, there is a placeholder variable with the suffix `_1`, `_2` and so on. For example:

```
{
  "_id": "esv-my-secret",
  "description": "",
  "encoding": "generic",
  "useInPlaceholders": true,
  "versions": [
    {
      "valueBase64": "${ESV_MY_SECRET_1}",
      "version": "1"
    },
    {
      "valueBase64": "${ESV_MY_SECRET_2}",
      "version": "2"
    }
  ]
}
```

This allows multiple versions to be set at push - e.g. where multiple token/SAML signing certificates and keys are required for key rollover. Note that the secret versions in the tenant will grow over time, and may need to be pruned periodically. Note that after pushing multiple versions, a restart will always be required.

If there is only one version configured in the file, and the value is the same as the current active version, no update will occur. If there are multiple versions, the last version in the configuration file is the active version of the secret in the tenant.

### Recommendations

For simplicity, it is recommended that secrets are pulled with the `--active-only` option to avoid unnecessary updates to secrets. This can be set as the default by setting the `ACTIVE_ONLY_SECRETS` configuration variable to `true` as per the sample `.env` file.

If necessary - e.g. during a key rollover window - individual secrets can be pulled without the `--active-only` option to create multiple versions on the next push.

The `--active-only` option is not the default for reasons of backwards compatibility with behaviour prior to the introduction of this option.
