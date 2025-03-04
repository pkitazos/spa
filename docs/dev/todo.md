# Tasks and Todos

## Refactors

### routers

- [x] **access-control** <!-- ok -->
  - [x] **institution** <!-- ok -->
  - [x] **institution.group** <!-- ok -->
  - [x] **institution.subGroup** <!-- ok -->
  - [x] **institution.instance** (2 remaining)
    - [ ] fork <!-- pin -->
    - [ ] merge <!-- pin -->
    - [ ] **institution.instance.algorithm** (2 remaining)
      - [ ] allStudentResults
      - [ ] allSupervisorResults
    - [x] **institution.instance.preference** <!-- ok -->
    - [ ] **institution.instance.matching** (3 remaining)
      - [ ] updateAllocation
      - [ ] getRandomAllocation <!-- pin -->
      - [ ] getRandomAllocationForAll <!-- pin -->
- [ ] **project** (1 remaining)
  - [ ] edit
- [x] **user** <!-- ok -->
  - [x] **user.student** <!-- ok -->
  - [x] **user.student.preferences** <!-- ok -->
  - [x] **user.supervisor** <!-- ok -->

### other qol

- [ ] lib/utils?
  - [ ] some TLC to `expand(params)`
- [ ] lib/validations
- [ ] centralise / standardise transformers
- [ ] middleware errors need to be filled in properly (currently using placeholder text)
- [ ] lots of middleware comments need to be stripped (Eventually)

### DB:

- [ ] standardise references to space params;
      -> i.e. an instanceId should always be referred to as `allocationInstanceId`
  - happy to do that now (and break a whole bunch of shit)
- [ ] same for userId (should always be userId)
  - well sometimes there's multiple different users in the same model (see RPA)
- [ ] add separate slug field to spaces (or we are doomed)
  - yep agreed
- [x] use the new multi-file schema's to make it a bit more tractable?
  - open to feedback on how to organise these

## From scratch

<!-- important but not urgent -->

- [ ] tests
- [ ] docs
- [ ] logs

# Other Tasks

- upload readings page

- [ ] add data table
- [ ] add single input form

- [ ] confirm if projects can have multiple allocations
- [ ] separate stage control into tabs
- [ ] make instance form multi-page

- [ ] tabs between chapters
- [ ] nested dropdown in sidebar
- [ ] my projects - split into supervisor + reader
- [ ] my marking - split by submission
- [ ] dropdown to filter by role for admins only
