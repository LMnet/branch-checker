# Branch checker

Simple tool to check branches through GitHub API.

## Setup

* Install git and nodejs on the server machine.
* Create user in github and give him permissions to the target repo.
* Create github access token with "repo" and "user" scopes.
* Add created user to the server machine (don't forget ssh keys).
* Add WebHook to the target github project. This WebHook should listen "Push" and "Pull Request" events. Content type "application/json".

That's all. After that you can run the application:

```
node main.js
```
