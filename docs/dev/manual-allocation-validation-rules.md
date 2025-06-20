# Manual Allocation Validation Rules

This document describes the validation warnings and errors that are detected and reported during the manual student-project allocation process.

## Error Types

severity: **Error**

### Project Already Allocated

- **Trigger**: Attempting to assign a student to a project that is already allocated to another student
- **Message**: "This project is already allocated to another student"

### Project Pre-Allocated

- **Trigger**: Attempting to assign a student to a project that is pre-allocated to another student
- **Message**: "This project is pre-allocated to another student"

### Supervisor Quota Exceeded

- **Trigger**: Assignment would cause supervisor to exceed their maximum allowed project quota
- **Message**: "Exceeds supervisor quota (X/Y)" where X is total allocations and Y is the quota limit
- **Note**: Only triggered when actually changing supervisors, not just reassigning students to same supervisor

## Warning Types

severity: **Warning**

### Flag Mismatch

- **Trigger**: Student's academic level flags don't match the project's requirements
- **Message**: "Student flags (Level X) don't match project requirements (Level Y)"
- **Example**: Level 4 student assigned to Level 5-only project

### Supervisor Target Exceeded

- **Trigger**: Assignment would cause supervisor to exceed their ideal target number of projects
- **Message**: "Exceeds supervisor target (X/Y)" where X is total allocations and Y is the target
- **Note**: Only triggered when actually changing supervisors, not just reassigning students to same supervisor

### Supervisor Change

- **Trigger**: Project is being assigned to a different supervisor than the original proposer
- **Message**: "Different supervisor than project proposer"

### Student Re-allocation

- **Trigger**: Student is being moved from one project to a different project
- **Message**: "Student already allocated to different project"
