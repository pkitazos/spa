import {
  StudentDTO,
  ProjectDTO,
  SupervisorDTO,
  ProjectAllocationStatus,
} from "@/dto";

export enum ValidationWarningType {
  FlagMismatch = "flag-mismatch",
  ExceedsTarget = "exceeds-target",
  ExceedsQuota = "exceeds-quota",
  AlreadyAllocated = "already-allocated",
  SupervisorChange = "supervisor-change",
  ProjectAllocated = "project-allocated",
  ProjectPreAllocated = "project-pre-allocated",
}

export enum ValidationWarningSeverity {
  Warning = "warning",
  Error = "error",
}

export type ValidationWarning = {
  type: ValidationWarningType;
  message: string;
  severity: ValidationWarningSeverity;
};

export type ManualAllocationStudent = StudentDTO & {
  // current allocation (what's saved in DB)
  originalProjectId?: string;
  originalSupervisorId?: string;

  // pending changes (what user has selected)
  selectedProjectId?: string;
  selectedSupervisorId?: string;

  isDirty: boolean;
  warnings: ValidationWarning[];
};

export type ManualAllocationProject = ProjectDTO & {
  status: ProjectAllocationStatus;
  currentStudentAllocationId?: string;
};

export type ManualAllocationSupervisor = SupervisorDTO & {
  currentAllocations: number;
  pendingAllocations: number;
};

export type AllocationChanges = { projectId?: string; supervisorId?: string };
