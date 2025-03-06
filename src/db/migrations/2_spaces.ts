import {
  DB,
  DB_AllocationGroup,
  DB_AllocationInstance,
  DB_AllocationSubGroup,
  stageSchema,
} from "../types";
import groups from "./data/AllocationGroup.json";
import instances from "./data/AllocationInstance.json";
import subGroups from "./data/AllocationSubGroup.json";

export async function spaces(db: DB) {
  const groupData = groups.map((x) => ({
    id: x.id,
    displayName: x.display_name,
  })) satisfies DB_AllocationGroup[];

  const subGroupData = subGroups.map((x) => ({
    id: x.id,
    displayName: x.display_name,
    allocationGroupId: x.allocation_group_id,
  })) satisfies DB_AllocationSubGroup[];

  const instanceData = instances.map((x) => ({
    id: x.id,
    allocationSubGroupId: x.allocation_sub_group_id,
    allocationGroupId: x.allocation_group_id,
    displayName: x.display_name,
    maxStudentPreferences: x.max_preferences,
    minStudentPreferences: x.min_preferences,
    maxStudentPreferencesPerSupervisor: x.max_preferences_per_supervisor,
    selectedAlgId: x.selected_alg_name,
    parentInstanceId: x.parent_instance_id,
    projectSubmissionDeadline: new Date(x.project_submission_deadline),
    studentPreferenceSubmissionDeadline: new Date(
      x.preference_submission_deadline,
    ),
    supervisorAllocationAccess: x.supervisor_allocation_access,
    studentAllocationAccess: x.student_allocation_access,
    maxReaderPreferences: x.max_reader_preferences,
    minReaderPreferences: x.min_reader_preferences,
    readerPreferenceSubmissionDeadline: new Date(
      x.reader_preference_submission_deadline,
    ),
    stage: stageSchema.parse(x.stage),
  })) satisfies DB_AllocationInstance[];

  await db.$transaction([
    db.allocationGroup.createMany({ data: groupData, skipDuplicates: true }),

    db.allocationSubGroup.createMany({
      data: subGroupData,
      skipDuplicates: true,
    }),

    db.allocationInstance.createMany({
      data: instanceData,
      skipDuplicates: true,
    }),
  ]);
}
