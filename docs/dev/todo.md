A Big list of things we need to refactor:

- [ ] routers:
  - [x] user
    - [x] getAdminPanel
    - [ ] breadcrumbs --> see user DO
    - [x] user.student
      - [ ] move some procedures to instance
      - [ ] refactor output types
    - [x] user.student.preferences
      - [ ] review comments (rename)
    - [x] user.supervisor
      - [ ] projectStats
    - [x] institution
    - [x] institution.group
      - [x] subGroupManagement
      - [x] takenSubGroupNames
      - [ ] addAdmin
      - [ ] removeAdmin
  - [x] institution.subGroup (6)
    - [ ] addAdmin
    - [ ] removeAdmin
    <!-- up to here -->
  - [ ] institution.instance (27)
  - [ ] institution.instance.algorithm (9)
  - [ ] institution.instance.external (3)
  - [ ] institution.instance.matching (12)
  - [ ] institution.instance.preference (5)
  - [ ] institution.instance.project (1)
  - [ ] project (15)
  - [ ] access-control (6)
- [ ] lib/utils?
- [ ] lib/validations
- [ ] tests

There are:

- 2 preferences routers
- 2 project routers

Can we merge these?
