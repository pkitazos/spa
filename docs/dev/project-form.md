# Project Form Schema Design

This document explains the schema architecture for the project forms in our app.

## Data Flow

The complete data flow through the system:

1. **Initialisation**: `FormInitialisationData` -> wrapper transforms -> `FormInternalStateData` (defaultValues)
2. **User interaction**: Form manages `FormInternalStateData` with React Hook Form
3. **Submission**: `FormInternalStateData` -> form transforms -> `FormSubmissionData`
4. **API call**: `FormSubmissionData` -> wrapper transforms -> `ApiInputData` -> tRPC procedure

## Role-Based Behavior

The form handles different user roles through conditional rendering and wrapper-level validation:

- **Supervisors**: `supervisorId` auto-filled, `capacityUpperBound` hidden
- **Admins**: All fields available, `supervisorId` required validation in wrapper

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

1. **Form Internal State Schema** - What React Hook Form manages internally
2. **Form Submission Schema** - Clean output when the form is submitted
3. **API Input Schemas** - What gets sent to tRPC procedures (Create/Edit variants)
4. **Form Initialisation Schema** - Data needed to populate and render the form

## Schema Details

**Location**: `@/dto/project`

### Form Internal State Schema

This represents what React Hook Form manages internally. It includes all possible fields that any user role might need, even if conditionally rendered. In a perfectly efficient world we would only fetch the data we need depending on the kind of user we're rendering the form for, but we do not live in that world unfortunately.

We use full `{id, title}` objects for flags and tags rather than just IDs - this makes the form components much simpler to work with since they can directly display titles without needing to cross-reference separate lookup tables. We also include a UI-only helper field `isPreAllocated` that doesn't correspond to any database field but helps control the behavior of other form elements like capacity bounds and student selection.

All role-specific fields are included in this schema even though they're conditionally rendered, which keeps the form component simple and avoids having multiple schema variants for different user types. The alternative would be complex conditional schema logic that would make the code much harder to maintain.

```tsx
const formInternalStateSchema = z.object({
  // Core project fields
  title: z.string().min(4, "Please enter a longer title"),
  description: z.string().min(10, "Please enter a longer description"),
  specialTechnicalRequirements: z.string().optional(),

  // Project attributes (full objects)
  flags: z
    .array(z.object({ id: z.string(), title: z.string() }))
    .min(1, "You must select at least one flag"),
  tags: z
    .array(z.object({ id: z.string(), title: z.string() }))
    .min(1, "You must select at least one tag"),

  // Capacity and allocation
  capacityUpperBound: z.coerce.number().int().positive().default(1),
  isPreAllocated: z.boolean().default(false), // UI-only helper field
  preAllocatedStudentId: z.string().optional(),

  // Admin-only field (conditionally rendered)
  supervisorId: z.string().optional(),
});
```

### Form Submission Schema

This schema represents the "cleaned up" version of the form data after the user submits. The main purpose is to remove UI-specific fields that don't belong in the business logic layer and to prepare the data for API transformation. The validation rules are intentionally less strict here because we've already validated everything at the form level - this schema is more about ensuring type safety during the transformation process.

The key transformation that happens here is removing the `isPreAllocated` helper field and conditionally clearing the `preAllocatedStudentId` based on the toggle state. This business logic happens in the form component itself rather than in the wrapper because it's directly tied to UI state.

```tsx
const formSubmissionSchema = z.object({
  // Core project fields
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),

  // Project attributes
  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),

  // Capacity and allocation
  capacityUpperBound: z.number().int().positive(),
  preAllocatedStudentId: z.string().optional(),

  // Admin-only field
  supervisorId: z.string().optional(),
});
```

**Transformation from internal state:**

The transformation from internal state to submission data happens in the ProjectForm component's submit handler. This is where we apply the business rule that pre-allocated projects must have a student ID, while non-pre-allocated projects should have this field cleared. We also remove the UI-only `isPreAllocated` field since it's not needed beyond this point.

The transformation logic is intentionally explicit - we map each field individually rather than using the spread operator to make it crystal clear what data is being passed along.

```tsx
const handleSubmit = (internalData: FormInternalStateData) => {
  const submissionData: FormSubmissionData = {
    title: internalData.title,
    description: internalData.description,
    specialTechnicalRequirements: internalData.specialTechnicalRequirements,
    flags: internalData.flags,
    tags: internalData.tags,
    capacityUpperBound: internalData.capacityUpperBound,
    // clear preAllocatedStudentId if not pre-allocated
    preAllocatedStudentId: internalData.isPreAllocated
      ? internalData.preAllocatedStudentId
      : undefined,
    supervisorId: internalData.supervisorId,
    // isPreAllocated is omitted since it's a UI-only field
  };

  onSubmit(submissionData);
};
```

### API Input Schemas

The API layer uses a different data format than the form layer because server-side code has different optimisation priorities. We send only IDs for flags and tags, which reduces the payload size and simplifies the server logic.

The wrapper components handle the transformation from rich objects to simple IDs. This keeps the API interface clean and ensures the server only receives the minimal data it needs to perform the operation. We also enforce that `supervisorId` is always present at this level, even if they are not always required by the form - the wrapper components are responsible for ensuring this field is populated based on the user's role.

```tsx
const createApiInputSchema = z.object({
  // Core project fields
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),

  // Project attributes (transformed to IDs)
  flagIds: z.array(z.string()),
  tagIds: z.array(z.string()),

  // Capacity and allocation
  capacityUpperBound: z.number().int().positive(),
  preAllocatedStudentId: z.string().optional(),

  // Always required at API level and the wrapper transformations  will ensure this exists (see below)
  supervisorId: z.string(),
});

const editApiInputSchema = createApiInputSchema.extend({
  id: z.string(), // Project ID for edit operations
});
```

**Transformation in wrapper components:**

The wrapper components (CreateProjectForm and EditProjectForm) handle the transformation from submission data to API data. This is where role-specific business logic gets applied - for supervisors, we auto-assign their user ID as the supervisorId, while for admins we require them to have selected a supervisor in the form.

The transformation helpers handle the work of converting object arrays to ID arrays, while the wrapper components handle the contextual logic like user role management. This separation (hopefully) makes the code easier to test and reason about.

```tsx
function onSubmit(submissionData: FormSubmissionData) {
  const apiData: ApiInputData = {
    title: submissionData.title,
    description: submissionData.description,
    specialTechnicalRequirements: submissionData.specialTechnicalRequirements,
    capacityUpperBound: submissionData.capacityUpperBound,
    preAllocatedStudentId: submissionData.preAllocatedStudentId,
    flagIds: submissionData.flags.map((flag) => flag.id),
    tagIds: submissionData.tags.map((tag) => tag.id),
    supervisorId: submissionData.supervisorId ?? user.id, // wrapper handles role logic
  };

  // then we call tRPC procedure with apiData
}
```

### Form Initialisation Schema

Data needed to populate and render the form, including available options and current project data for editing.

```tsx
const formInitialisationSchema = z.object({
  // Available options for selection
  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),
  studentIds: z.array(z.string()),
  supervisorIds: z.array(z.string()),

  // Validation helpers
  takenTitles: z.set(z.string()),

  // Current project data (for edit forms only)
  currentProject: editApiInputSchema.optional(),
});
```

**Edit form initialization:**

```tsx
const EditProjectForm = ({ formInitializationData }) => {
  const { currentProject } = formInitializationData;

  // Transform API format back to form format
  const defaultValues = currentProject
    ? {
        ...currentProject,
        flags: formInitializationData.flags.filter((flag) =>
          currentProject.flagIds.includes(flag.id),
        ),
        tags: formInitializationData.tags.filter((tag) =>
          currentProject.tagIds.includes(tag.id),
        ),
        isPreAllocated: !!currentProject.preAllocatedStudentId,
        // flagIds, tagIds omitted
      }
    : undefined;

  return (
    <ProjectForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      {...otherProps}
    />
  );
};
```
