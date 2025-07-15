import {
  StudentDTO,
  ProjectDTO,
  SupervisorDTO,
  ProjectAllocationStatus,
} from "@/dto";

export const ValidationWarningType = {
  /** Student flag and Project flags are incompatible */
  FLAG_MISMATCH: "flag-mismatch",
  /** Allocating to this Supervisor will exceed their supervision target */
  EXCEEDS_TARGET: "exceeds-target",
  /** Allocating to this Supervisor will exceed their supervision upper quota */
  EXCEEDS_QUOTA: "exceeds-quota",
  /** This Student already has a different Project allocation */
  ALREADY_ALLOCATED: "already-allocated",
  /** Allocating Project to a different Supervisor */
  SUPERVISOR_CHANGE: "supervisor-change",
  /** This Project is already allocated to a different Student */
  PROJECT_ALLOCATED: "project-allocated",
  /** This Project was self-defined by a different Student */
  PROJECT_PRE_ALLOCATED: "project-pre-allocated",
} as const;

export type ValidationWarningType =
  (typeof ValidationWarningType)[keyof typeof ValidationWarningType];

export const ValidationWarningSeverity = {
  WARNING: "warning",
  ERROR: "error",
} as const;

export type ValidationWarningSeverity =
  (typeof ValidationWarningSeverity)[keyof typeof ValidationWarningSeverity];

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
