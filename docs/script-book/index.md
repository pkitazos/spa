# The Amps CLI

Amps is a fairly complex app with lots of moving pieces.
To make matters worse, deployment is often even more complicated;
requiring database and log backups that are moved off-machine,
automatic service restarts, and a variety of other odd jobs that you
might only use occasionally.

Originally, his was all hand rolled, custom to the deployment.
But when we moved to a 2 deployment system (prod + staging) it quickly became apparent
that our current system wasn't suitable.

This is the documentation for the new system. The aim is to provide
docs for both how to use the new CLI script, and how to add new features to it.

---

Sub-commands
