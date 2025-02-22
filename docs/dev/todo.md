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
  - [x] institution.instance (10)
    <!-- all of these are transactions -->

    - [ ] addSupervisor
    - [ ] addSupervisors
    - [ ] addStudent
    - [ ] addStudents
    - [ ] removeStudent
    - [ ] removeStudents
    - [ ] getPreAllocatedStudents
    - [ ] edit
    - [ ] fork
    - [ ] merge

  - [x] institution.instance.project (1)
  <!-- up to here -->

  - [ ] institution.instance.algorithm (9)
  - [ ] institution.instance.matching (12)
  - [x] institution.instance.preference (4)
  - [ ] project (15)
  - [x] access-control (5)

- [ ] lib/utils?
- [ ] lib/validations
- [ ] tests

There are:

- 2 preferences routers
- 2 project routers

Can we merge these?
