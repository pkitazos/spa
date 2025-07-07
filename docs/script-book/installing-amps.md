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

- docker
- gnu-getopt (n.b. basic-getopt, which ships with MacOS by default, will not work)
- git

Optionally:

- A configured mutt mail client (if you want to send restart notifications)
  - make sure there's a working config at `/root/.muttrc`
- [Webhook](https://www.google.com/search?q=webhook.go&sourceid=chrome&ie=UTF-8) (if you want to set up webhook based rolling release for the auto-updater)

If you're going to set up backups for logs or the database, then you will also need to:

- set up a remote git repository to store each (one for logs, one for db-images).
- configure git for root so that it has push rights for both of these.

You don't need to clone these; the setup script will take care of it.
But make sure you have their remote URLs to hand.

Once this is all sorted, you can clone the AMPS repository;

Then run `./scripts/deploy/amps config init`.
Make sure you run this in the root of the repository. The script checks for a `package.json` file,
so it should error if you get this wrong.

The install wizard will ask you a series of questions about how you want you're deployment configured.
Just answer them, and it will take care of it.

One of the things this does is put the amps cli on the path - so you can just use
`amps` (instead of `$AMPS_LOC/scripts/deploy/amps`) once the installer is finished.

To get amps working, you will need to set up the `.env` file for your deployment.
See the environment variable documentation for details of what to put in that file.
This should be written at the repository root - so `$AMPS_LOC/.env`.

<!-- TODO

Once all the variables are written in, you can check the file is OK
with `amps check-env`.

Just once, you need to make sure the database has the correct schema.
If you're starting up from scratch, you can do this with `amps db push`.

If you're using an existing db-image file, (i.e. because you're on staging and want to)
then you can use `amps db restore <image file>`. -->

Finally, you can start up the deployment with `amps start`.
