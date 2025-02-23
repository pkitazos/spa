A Big list of things we need to refactor:

## routers:

- [x] **user**
  - [ ] breadcrumbs see user DO)
  - [x] **user.student**
    - [ ] move some procedures to instance
    - [ ] refactor output types
  - [x] **user.student.preferences**
    - [ ] review comments (rename)
  - [x] **user.supervisor**
    - [ ] projectStats
- [x] **institution**
- [x] **institution.group**
  - [ ] addAdmin
  - [ ] removeAdmin
- [x] **institution.subGroup** (6)
  - [ ] addAdmin
  - [ ] removeAdmin
- [x] **institution.instance** (10)
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
- [x] **institution.instance.project** (1)
- [ ] **institution.instance.algorithm** (9)
- [ ] **institution.instance.matching** (9)
  - [ ] rowData
  - [ ] updateAllocation
- [x] **institution.instance.preference** (4)
- [ ] **project** (15)
- [x] **access-control** (5)

## other qol

- [ ] lib/utils?
- [ ] lib/validations

## the big one

- [ ] tests
