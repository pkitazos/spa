# Sending Email

The system sends a variety of automatic notifications via email. We do this using SMTP, and you need to set some environment variables to make this work.

You always have to specify `MAIL_HOST` and `MAIL_PORT`, to specify the address of the SMTP server.
Similarly, you must specify `MAIL_USER`;
This is used as the sending address for the automatic emails.

If you specify a `MAIL_PASSWORD` variable, the system will use it (together with `MAIL_USER`) to try and authenticate itself against the SMTP server.

The password can be omitted if no authentication is necessary.

Everything relating to email can be found in `src/emails`.

Message templates and components can be found in `src/emails/messages` and `src/emails/components` respectively.

All mail-sending logic is encapsulated in the `mailer` class. In the constructor this accepts a `sendMail` function, which can be used to send the actual email.

You could also mock this out for testing.
