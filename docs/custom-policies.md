# Custom policies

Custom policies are stored under the configuration directory `custom-policies`. There is one subdirectory for each policy, named according to the respective policy id. There are two files within each directory:

`<policyId>.json` contains the policy configuration
`<policyId>.js` contains the function with the policy logic

For example, given a policy called `acme-email-challenge` there is a directory `<tenant-config>/acme-email-domain` containing

`acme-email-domain.json`

```
{
  "policyExec": "acmeEmailDomain",
  "policyId": "acme-email-domain",
  "policyRequirements": [
    "ACME_EMAIL_DOMAIN"
  ],
  "validateOnlyIfPresent": true
}
```

`acme-email-domain.js`

```
function acmeEmailDomain(fullObject, value, params, property) {
  var domain;
  var normalizedValue;
  if (
    value === null ||
    typeof value === "undefined" ||
    String(value).length === 0
  ) {
    return [];
  }
  domain = params && params.domain ? String(params.domain) : "@acme.co.uk";
  if (domain.charAt(0) !== "@") {
    domain = "@" + domain;
  }
  domain = domain.toLowerCase();
  normalizedValue = String(value).toLowerCase();
  if (
    normalizedValue.length < domain.length ||
    normalizedValue.substring(normalizedValue.length - domain.length) !== domain
  ) {
    return [{ policyRequirement: "ACME_EMAIL_DOMAIN" }];
  }
  return [];
}
```

A new policy can be pushed by manually creating a directory under the `custom-policies` directory and adding the `.js` and `.json` files with the implementation, then running `fr-config-push custom-policies`.
