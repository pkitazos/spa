import { ProjectPreferenceCardDto } from "@/lib/validations/board";

export function getSubmissionErrors(
  preferences: ProjectPreferenceCardDto[],
  restrictions: {
    minPreferences: number;
    maxPreferences: number;
    maxPreferencesPerSupervisor: number;
  },
) {
  const overSelected = computeOverSelected(
    preferences,
    restrictions.maxPreferencesPerSupervisor,
  );

  return {
    isOver: preferences.length > restrictions.maxPreferences,
    isUnder: preferences.length < restrictions.minPreferences,
    hasOverSelectedSupervisor: overSelected.length > 0,
    overSelected,
  };
}

function computeOverSelected(
  preferenceList: ProjectPreferenceCardDto[],
  maxPerSupervisor: number,
) {
  const supervisorCounts = preferenceList.reduce(
    (acc, { supervisor }) => ({
      ...acc,
      [supervisor.id]: {
        count: (acc[supervisor.id]?.count ?? 0) + 1,
        name: supervisor.name,
      },
    }),
    {} as { [key: string]: { name: string; count: number } },
  );

  const overSelected = Object.entries(supervisorCounts)
    .map(([id, rest]) => ({ id, ...rest }))
    .filter(({ count }) => count > maxPerSupervisor);

  return overSelected;
}
