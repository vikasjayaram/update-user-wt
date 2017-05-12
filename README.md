# Calling a API to update user object using webtask based on id_token.

Sample project for creating an Express-based server that runs on webtask.io for accessing updating a user app_metadata.
### Version
0.0.1
# Initial Setup & Configuration
```bash
# Create a new wt-cli profile
npm install -g wt-cli
wt init

# Or, if you already use wt-cli:
wt profile ls
```

### Initialization
```sh
$ wt create updateuserinfo.js --name uu
    -s CLIENT_ID=YOUR_NON_INTERACTIVE_AUTH0_CLIENT_ID
    -s CLIENT_SECRET=YOUR_NON_INTERACTIVE_AUTHO_CLIENT_SECRET
    -s ACCOUNT_NAME=YOUR_AUTH0_TENANT_NAME
```
The above command would create a webtask and give you a url like this
```
Webtask created

You can access your webtask at the following url:

https://vjayaram.au.webtask.io/uu
```
# Usage
```sh
  "use strict";
  const request = require('request');
  const options = {
    url: 'URL_WHEN_YOU_CREATE_WEBTASK',
    headers: {Authorization: 'Bearer USER_ID_TOKEN'},
    json: {account_number: '123456'}
  };
  request.post(options, function (e, r, b){});
```
