Getting the app to run on startup is a bit of a pain.
Fortunately for you, dear reader, I've already done it.
Here is my tale of woe.

First of all, you need a script which will start up
all the containers we need to run.
For me, a simple startup script looks like this:

```bash
#!/usr/bin/bash
pushd /home/gussdev

docker compose -f docker-compose.staging.yml up -d

popd
```

Make sure this script is executable, with

```
chmod +x ./startup.sh
```

Then, we need to configure a systemd service
which runs this script on startup.
To do this, you first have to write a service definition,
which looks like this:

```ini
[Unit]
Description=Amps-app startup service

[Service]
Type=exec
ExecStart=/home/gussdev/startup.sh

[Install]
WantedBy=multi-user.target
```

We give it a description (make it nice, it helps with debugging);
we need to specify what command to run (in this case, our startup script);
and finally, we need to record that it is 'wanted' by the system, and so
should be run on startup. That's what that last line is doing.

This file should live in the `/etc/systemd/system` directory.
For me, it's called `/etc/systemd/system/amps-startup.service`
The filename is important. This service is called `amps-startup`,
to match the filename.

Now, we need to enable this service.
That means just running the following command:

```bash
sudo systemctl enable amps-startup.service
```

Now, all being well, if you reboot the machine,
the script should run before you even have the chance to SSH in,
and your services will all start automatically.
