# Masquerading

> masquerade (/ˌmɑːskəˈreɪd/)
>
> verb
>
> 1. pretend to be someone one is not.
> 2. be disguised or passed off as something else.

It's very useful for testing purposes to be able
to pretend to be a different user.
AMPS supports this via the masquerading system.

The `auth()` (`@/lib/auth/index.ts`) function is the
main entry point to AMPS authentication.
It returns an object with two properties.

`real` contains the 'real' user - the one authenticated
by normal means like headers.

When masquerading is disabled (i.e. by setting the `AUTH_MASKING_ENABLED` env var
to its' default value of `OFF`), `mask` contains only a copy of `real`.

When masquerading is `ON` however, `mask` contains
the current authentication mask.
This is a different user - the one we want to pretend to be.
This is set by means of a cookie (`dev-selected-user-id`) which stores
the ID of the mask user.

---

## Using Masquerading

Generally, when writing application code, if you need access to the current user, you should use `mask`.
Most business logic should not be able to tell the difference between a real and masqueraded user - that's the whole point of masquerading.

For some features however, it's important to use the real user - for instance, in whitelisting.
It's important that a user is not able to circumvent the whitelist by setting the masquerade cookie.

Masquerading should also _always_ be off in prod.
