### Admins Vs Managers

'Admin' is a stricter term than manager.
If a user is an admin for a space, that means that they are an admin _specifically_ for that space. For example, a group admin is an Admin for that group.

If a user managers a space, that means they have a generalised permission on it. For example, a group admin still manages groups, but also subgroups and instances. Checking if a user is a manager for a base corresponds to "xOrBetter" methods.

### Create vs Link | Delete vs Unlink

Create methods always involve creating some underlying data - so users are created.

Link methods usually involve creating relations between existing objects. A good example is admins;
Admins are users linked to a specific space. There's no `group.addAdmin()` method - rather, there is a `group.linkAdmin()` method, which creates a record in the appropriate linking table. It doesn't touch the real data-objects, but assumes they already exist.

In a parallel manner, delete destroys an underling object (e.g. deletes a user) whereas unlink merely removes the relationship between two objects.
