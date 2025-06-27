Operating a system like this is quite complex, so we have developed a CLI that
simplifies a lot of common tasks.

However, the CLI depends on a proper setup (mostly in the form of various environment
variables being set correctly). To make sure this works,
you should use the install script that ships with the AMPS CLI.

This will guide you through installing AMPS, and also set up the required environment
variables along the way, so that the AMPS CLI will works afterwards.

---

## Pre-requisites

Before installing AMPS, make sure you have:

- rootless docker
- gnu-getopt (n.b. basic-getopt, which ships with MacOS by default, will not work)
- git

Optionally:

- A configured mutt mail client (if you want to send restart notifications)
- [Webhook](https://www.google.com/search?q=webhook.go&sourceid=chrome&ie=UTF-8) (if you want to set up webhook based rolling release for the auto-updater)

You can then clone the repository, and run `./scripts/deploy/amps install`.
Make sure you run this in the root of the repository. The script checks for a `package.json` file,
so it should error if you get this wrong.
