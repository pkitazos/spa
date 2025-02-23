# Tasks and Todos

## Refactors

### routers

- [x] **access-control** <!-- ok -->
  - [x] **institution** <!-- ok -->
  - [x] **institution.group** (2 remaining)
    - [ ] addAdmin <!-- todo -->
    - [ ] removeAdmin <!-- todo -->
  - [x] **institution.subGroup** (2 remaining)
    - [ ] addAdmin <!-- todo -->
    - [ ] removeAdmin <!-- todo -->
  - [x] **institution.instance** (10 remaining)
    - [ ] addSupervisor <!-- pin -->
    - [ ] addSupervisors <!-- pin -->
    - [ ] addStudent <!-- pin -->
    - [ ] addStudents <!-- pin -->
    - [ ] removeStudent <!-- pin -->
    - [ ] removeStudents <!-- pin -->
    - [ ] edit <!-- pin -->
    - [ ] getHeaderTabs <!-- pin -->
    - [ ] fork <!-- pin -->
    - [ ] merge <!-- pin -->
    - [ ] **institution.instance.algorithm** (9 remaining)
      - [ ] run
      - [ ] takenNames
      - [ ] create
      - [ ] delete
      - [ ] getAll
      - [ ] getAllSummaryResults
      - [ ] singleResult
      - [ ] allStudentResults
      - [ ] allSupervisorResults
    - [x] **institution.instance.preference** <!-- ok -->
    - [ ] **institution.instance.matching** (4 remaining)
      - [ ] rowData <!-- todo -->
      - [ ] updateAllocation <!-- todo -->
      - [ ] getRandomAllocation <!-- pin -->
      - [ ] getRandomAllocationForAll <!-- pin -->
- [ ] **project** (16 remaining)
  - [ ] edit
  - [ ] getAllForStudentPreferences
  - [ ] getAllForUser
  - [ ] getAllLateProposals
  - [ ] getAllPreAllocated
  - [ ] getById
  - [ ] getIsForked
  - [ ] getUserAccess
  - [ ] getAllStudentPreferences
  - [ ] delete
  - [ ] deleteSelected
  - [ ] details
  - [ ] create
  - [ ] getFormDetails
  - [ ] getAllocation
  - [ ] supervisorSubmissionInfo
- [x] **user** <!-- ok -->
  - [x] **user.student** <!-- ok -->
  - [x] **user.student.preferences** <!-- ok -->
  - [x] **user.supervisor** <!-- ok -->

### other qol

- [ ] lib/utils?
- [ ] lib/validations
- [ ] centralise / standardise transformers

## From scratch

<!-- important but not urgent -->

- [ ] tests
- [ ] docs
