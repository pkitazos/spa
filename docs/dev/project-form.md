# Project Form Schema Design

This document explains the schema architecture for the project forms in our app.

We have developed a generic project form component;
it is intended that this is consumed by a wrapper component that specialises it for a particular function (e.g. creation, editing).

## Data Flow

The complete data flow through the generic form; more detailed explanations of the individual schemas/types can be found below.

1. **Initialisation**: `ProjectFormInitialisationDTO` (from query) -> wrapper transforms -> `ProjectFormInternalStateDTO` (defaultValues)
2. **User interaction**: Form manages `ProjectFormInternalStateDTO` with React Hook Form
3. **Submission**: `ProjectFormInternalStateDTO` -> form transforms -> `ProjectFormSubmissionDTO` (the form's output)
4. **API call**: `ProjectFormSubmissionDTO` -> wrapper transforms -> `ProjectApiInputDTO` (differs depending on query) -> tRPC procedure

## Role-Based Behavior

The form handles different user roles through conditional rendering; validation needs to be wrapper-level:

- **Supervisors**: `supervisorId` auto-filled, `capacityUpperBound` hidden
- **Admins**: All fields available.

This allows us to keep the core form component role-agnostic while also enabling flexible behavior based on user context.

## Design

Each schema serves a specific purpose and (attempts to) maintains clear boundaries:

- UI concerns stay in the form layer
- Business logic transformations happen in wrapper components
- API transformations are always explicit!
- Full `Tag` and `Flag` objects are used consistently throughout the client / form code
- API layer uses simple ID arrays for simpler server logic

## Overview

We have designed four distinct schemas that handle data at different stages of the form lifecycle:

1. **Project Form Initialisation Schema** - Data needed to populate and render the form
2. **Project Form Internal State Schema** - What React Hook Form manages internally
3. **Project Form Submission Schema** - Clean output when the form is submitted
4. **Project Form API Input Schemas** - What gets sent to tRPC procedures (Create/Edit variants)

All of these can be found in `@/dto/project`.

### Form Initialisation Schema (`ProjectFormInitialisationDTO`)

This schema defines the data structure for the form's initialisation. It contains all the information required to render the component, including the available options for selection fields and the current project data for editing. It provides the complete Flag and Tag objects for the selection controls, a full list of student IDs to allow a project to be marked as 'student-defined', and a list of all supervisors to enable project assignment by an administrator.

### Form Internal State Schema (`ProjectFormInternalStateDTO`)

This represents what React Hook Form manages internally. It includes all possible fields that any user role might need, even if conditionally rendered. In a perfectly efficient world we would only fetch the data we need depending on the kind of user we're rendering the form for, but we do not live in that world unfortunately.

We use full `{id, title}` objects for flags and tags rather than just IDs - this makes the form components much simpler to work with since they can directly display titles without needing to cross-reference separate lookup tables. We also include a UI-only helper field (`isPreAllocated`) that doesn't correspond to any database field but helps control the behavior of other form elements like capacity bounds and student selection.

All role-specific fields are included in this schema even though they're conditionally rendered, which keeps the form component simple and avoids having multiple schema variants for different user types. The alternative would be complex conditional schema logic that would make the code much harder to maintain.

### Form Submission Schema (`ProjectFormSubmissionDTO`)

This schema represents the "cleaned up" version of the form data after the user submits. The main purpose is to remove UI-specific fields that don't belong in the business logic layer and to prepare the data for API transformation. The validation rules are intentionally less strict here because we've already validated everything at the form level - this schema is more about ensuring type safety during the transformation process.

The key transformation that happens here is removing the `isPreAllocated` helper field and conditionally clearing the `preAllocatedStudentId` based on the toggle state. This business logic happens in the form component itself rather than in the wrapper because it's directly tied to UI state.

The transformation logic is intentionally explicit - we map each field individually rather than using the spread operator to make it crystal clear what data is being passed along.

### API Input Schemas (`ProjectFormEditApiInputDTO` and `ProjectFormInitialisationDTO`)

The API layer uses a different data format than the form layer because server-side code has different optimisation priorities. We send only IDs for flags and tags, which reduces the payload size and simplifies the server logic.

The wrapper components handle the transformation from rich objects to simple IDs. This keeps the API interface clean and ensures the server only receives the minimal data it needs to perform the operation. We also enforce that `supervisorId` is always present at this level, even if they are not always required by the form - the wrapper components are responsible for ensuring this field is populated based on the user's role.

The wrapper components (`CreateProjectForm` and `EditProjectForm`) handle the transformation from submission data to API data. This is where role-specific business logic gets applied - for supervisors, we auto-assign their user ID as the supervisorId, while for admins we require them to have selected a supervisor in the form.

The transformation helpers handle the work of converting object arrays to ID arrays, while the wrapper components handle the contextual logic like user role management. This separation (hopefully) makes the code easier to test and reason about.
