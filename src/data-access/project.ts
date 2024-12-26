export function optional<T>(value: T | null) {
  return value === null ? undefined : value;
}

// SINGLE
// find project
// get project
// get project with [blank]
// create project
// update project
// delete project

// MANY
// get projects
// get projects with [blank]
// create projects
// update projects (might not be necessary ?)
// delete projects
