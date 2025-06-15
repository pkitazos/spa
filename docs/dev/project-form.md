# Project Form Schema Design

This document explains the schema architecture for the project forms in our app.

## Overview

We have designed four distinct schemas that handle data at different stages of the form lifecycle:

1. **Form Internal State Schema** - What React Hook Form manages internally
2. **Form Submission Schema** - Clean output when form is submitted
3. **API Input Schemas** - What gets sent to tRPC procedures (Create/Edit variants)
4. **Form Initialisation Schema** - Data needed to populate and render the form

## Design

Each schema serves a specific purpose and (attempts to) maintains clear boundaries:

- UI concerns stay in the form layer
- Business logic transformations happen in wrapper components
- API transformations are always explicit!
- Full `Tag` and `Flag` objects are used consistently throughout the client / form code
- API layer uses simple ID arrays for simpler server logic

## Schemas

### Form Internal State Schema

This represents what React Hook Form manages internally. It includes all possible fields that any user role might need, even if conditionally rendered. In a perfectly efficient world we would only fetch the data we need depending on the kind of user we're rendering the form for, but we do not live in that world unfortunately

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

We clean the output when the form is submitted, before any API transformations. This removes UI-only fields and has more relaxed validation since form validation has already occurred.

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

```tsx
const handleSubmit = (internalData: FormInternalStateData) => {
  const submissionData: FormSubmissionData = {
    ...internalData, // will actually explicitly set all the fields here instead
    // clear preAllocatedStudentId if not pre-allocated
    preAllocatedStudentId: internalData.isPreAllocated
      ? internalData.preAllocatedStudentId
      : undefined,
    // isPreAllocated is omitted since it's a UI-only field
  };

  onSubmit(submissionData);
};
```

### API Input Schemas

This is what gets sent to the tRPC procedures. Objects are transformed to ID arrays for simpler handling on the server.

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

```tsx
function onSubmit(submissionData: FormSubmissionData) {
  const apiData: ApiInputData = {
    ...submissionData, // will also actually explicitly set all the fields here instead
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

**Edit form initialisation:**

```tsx
function EditProjectForm({ formInitialisationData }) {
  const { currentProject } = formInitialisationData;

  // transform API format back to form format
  const defaultValues = currentProject
    ? {
        ...currentProject, // also do this explicitly here
        flags: formInitialisationData.flags.filter((flag) =>
          currentProject.flagIds.includes(flag.id),
        ),
        tags: formInitialisationData.tags.filter((tag) =>
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
      {...anyOtherProps}
    />
  );
}
```

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
