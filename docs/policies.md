# Policy configuration

The policy configuration file contains a list of policy sets to pull from the Identity Cloud tenant, for subsequent push to each target environment.

The path to this file is configured in the `.env` file (or environment directly) as the `AUTHZ_POLICY_SETS_CONFIG` value.

The file contains a JSON encoded object, containing a top level property for each realm. Each realm object contains a list of policy set names to pull.

A sample file is as follows

```
{
  "alpha": [
    "investment-services",
    "account-dashboard"
  ],
  "bravo": []
}
```
