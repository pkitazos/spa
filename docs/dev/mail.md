# Sending Email

## Infrastructure

The system sends a variety of automatic notifications via email. We do this using SMTP, and you need to set some environment variables to make this work.

You always have to specify `MAIL_HOST` and `MAIL_PORT`, to specify the address of the SMTP server.
Similarly, you must specify `MAIL_USER`;
This is used as the sending address for the automatic emails.

If you specify a `MAIL_PASSWORD` variable, the system will use it (together with `MAIL_USER`) to try and authenticate itself against the SMTP server.

The password can be omitted if no authentication is necessary.

---

## Writing Code

Everything relating to email can be found in `src/emails`.

Every email we send is sent for a specific purpose; For each of these, we have a 'template',
which defines how that message looks.
Templates can all be found in `src/emails/messages`.
A template is simply a react component, and they work like any other.
They accept props and render out their contents.
Note that regular HTML does not work in email templates - you need
to use the special components provided by react email.
Documentation on this can be found in [the react email docs](https://react.email/docs/components/html).

There are a handful of re-used components, and these can all be found in `src/emails/components` respectively.

All mail-sending logic is encapsulated in the `mailer` class. The mailer
is a class that groups together emails into common purposes.
We may send more than one email for a given purpose. For instance, the coordinator
is usually sent a copy or a variant for all messages, to keep them in the loop.
Instead of having to issue multiple calls, all relevant emails
are sent in the corresponding function in the mailer - so
as a consumer, you don't need to care.

In the mailer's constructor you must provide `sendMail` function,
which is used to send the actual email. The intention is to mock this out for testing,
to avoid sending actual mail.
