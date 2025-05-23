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

## From scratch

<!-- important but not urgent -->

- [ ] tests
- [ ] docs
- [ ] logs ---< very important - feature requested by client.

# Other Tasks

- [ ] add data table for 'uploading reader allocations'
- [ ] add single input form for 'upload reader allocations' page
- [-] make instance form multi-page -> this should really be a collection of forms.

---

- [-] replicated SQL backups to 2nd machines -> add git commit & push to backup script
- [ ] Marking overwrite page for unit of assessment (needed for moderation)
      negotiation 3 resolution
  - [ ] link to this too

---

- [ ] summary counters on marking overview page
- [ ] marking review page
- [ ] resolve button on my marking page.
- [ ] TLC to resolve page
- [ ] add date when negotiation triggered
- [ ] index marking overview by academic

# next release

- [ ] change user info (name, email, id)
- [ ] change project title.
- [ ] custom deadlines -> 100% a thing
- [ ] custom weights
- [ ] allow users to delete users
- [ ] add a field to the database that records if a project is 40 or 20 credits
  - [ ] This should also be displayed to markers somehow.

---

- [ ] update NextJS version maybe
