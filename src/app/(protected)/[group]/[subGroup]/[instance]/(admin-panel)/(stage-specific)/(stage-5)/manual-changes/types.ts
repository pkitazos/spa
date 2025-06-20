import { FlagDTO, ProjectAllocationStatus } from "@/dto";

export type StudentAllocation = {
  studentId: string;
  studentName: string;
  studentFlags: FlagDTO[];
  originalProjectId?: string;
  originalSupervisorId?: string;
  newProjectId?: string;
  newSupervisorId?: string;
  isDirty: boolean;
  warnings: ValidationWarning[];
};

export type ProjectInfo = {
  id: string;
  title: string;
  flags: FlagDTO[];
  originalSupervisorId: string;
  currentStudentAllocationId?: string;
  status: ProjectAllocationStatus;
};

export type SupervisorInfo = {
  id: string;
  name: string;
  allocationTarget: number;
  allocationUpperBound: number;
  currentAllocations: number;
  pendingAllocations: number;
};

export type AllocationChange = {
  studentId: string;
  originalProjectId?: string; // undefined for unallocated students
  originalSupervisorId?: string;
  newProjectId?: string;
  newSupervisorId?: string;
  isDirty: boolean;
  warnings: ValidationWarning[];
};

export enum ValidationWarningType {
  FlagMismatch = "flag-mismatch",
  ExceedsTarget = "exceeds-target",
  ExceedsQuota = "exceeds-quota",
  AlreadyAllocated = "already-allocated",
  SupervisorChange = "supervisor-change",
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
