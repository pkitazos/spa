students can access:

- /all-projects
- /all-project/<id>
- /my-preferences
- /my-allocation

supervisors can access:

- /all-projects
- /all-projects/<id>
- /all-projects/<id>/edit -> IFF they own the project
- /my-proposed-projects
- /my-supervisions
- /new-project
- /my-marking
- /my-marking/<unit-id>

reader can access:

- /all-projects
- /all-projects/<id>
- /my-marking
- /my-marking/<unit-id>

admin can access:

- all if segments valid

## handled:

group admin or better:

- /<group-id>
- /<group-id>/create-subgroup

subgroup admin or better:

- /<group-id>/<subgroup-id>
- /<group-id>/<subgroup-id>/create-instance

super admin:

- /admin
- /admin/create-group

everyone

- /me
