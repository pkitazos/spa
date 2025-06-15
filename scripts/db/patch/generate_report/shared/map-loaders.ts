export async function loadMapsStatically(markingGroup: string) {
  const { PROJECTS_MAP } = await import(
    `../data/maps/${markingGroup}/projectsMap`
  );
  const { READERS_MAP } = await import(
    `../data/maps/${markingGroup}/readersMap`
  );
  const { STUDENTS_MAP } = await import(
    `../data/maps/${markingGroup}/studentsMap`
  );
  const { SUPERVISORS_MAP } = await import(
    `../data/maps/${markingGroup}/supervisorsMap`
  );
  const { SPA_MAP } = await import(`../data/maps/${markingGroup}/spaMap`);
  const { CONDUCT_CRITERIA } = await import(
    `../data/criteria/${markingGroup}/conductCriterion`
  );
  const { DISSERTATION_CRITERIA } = await import(
    `../data/criteria/${markingGroup}/dissertationCriteria`
  );
  const { PRESENTATION_CRITERIA } = await import(
    `../data/criteria/${markingGroup}/presentationCriteria`
  );

  return {
    STUDENTS_MAP,
    PROJECTS_MAP,
    SUPERVISORS_MAP,
    READERS_MAP,
    SPA_MAP,
    CONDUCT_CRITERIA,
    DISSERTATION_CRITERIA,
    PRESENTATION_CRITERIA,
  };
}
