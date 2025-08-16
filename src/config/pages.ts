import { Role } from "@/db/types";

import {
  type GroupParams,
  type SubGroupParams,
} from "@/lib/validations/params";

type PageLevel = 1 | 2 | 3 | 4 | 5;

export interface PageConfig {
  title: string;
  href: string;
  mkUrl: (_: never) => string;
  icon?: string;
  level: PageLevel;
  allowedRoles: Role[];
  hasSubRoute: boolean;
}

export const PAGES = {
  home: {
    title: "Home",
    href: "",
    mkUrl: () => "/",
    level: 1,
    allowedRoles: [Role.ADMIN, Role.READER, Role.STUDENT, Role.SUPERVISOR],
    hasSubRoute: false,
  },
  me: {
    title: "Me",
    href: "me",
    mkUrl: () => "/me",
    level: 1,
    allowedRoles: [Role.ADMIN, Role.READER, Role.STUDENT, Role.SUPERVISOR],
    hasSubRoute: false,
  },
  superAdminPanel: {
    title: "Admin Panel",
    href: "admin",
    mkUrl: () => "/admin",
    level: 1,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: true,
  },
  userManagement: {
    title: "User Management",
    href: "all-users",
    mkUrl: () => "/all-users",
    level: 2,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  newGroup: {
    title: "New Group",
    href: "create-group",
    mkUrl: () => "/create-group",
    level: 2,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  newSubGroup: {
    title: "New Sub-Group",
    href: "create-sub-group",
    mkUrl: ({ group }: GroupParams) => `/${group}/create-sub-group`,
    level: 2,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  newInstance: {
    title: "New Instance",
    href: "create-instance",
    mkUrl: ({ group, subGroup }: SubGroupParams) =>
      `/${group}/${subGroup}/create-instance`,
    level: 3,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },

  settings: {
    title: "Settings",
    href: "settings",
    icon: "settings",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  instanceEdit: {
    title: "Edit",
    href: "edit",
    icon: "pen",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  stageControl: {
    title: "Stage Control",
    href: "stage-control",
    icon: "layers",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  allSupervisors: {
    title: "All Supervisors",
    href: "all-supervisors",
    icon: "users",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: true,
  },
  newSupervisorProject: {
    title: "New Project",
    href: "new-project",
    icon: "file-plus-2",
    level: 5,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  createProject: {
    title: "Create Project",
    href: "create-project",
    icon: "file-plus-2",
    level: 3,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },

  // pin
  allReaders: {
    title: "All Readers",
    href: "all-readers",
    icon: "users",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: true,
  },

  allStudents: {
    title: "All Students",
    href: "all-students",
    icon: "graduation-cap",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: true,
  },
  studentPreferences: {
    title: "Preferences",
    href: "preferences",
    icon: "folder",
    level: 5,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  addSupervisors: {
    title: "Add Supervisors",
    href: "add-supervisors",
    icon: "user-plus",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  addStudents: {
    title: "Add Students",
    href: "add-students",
    icon: "user-plus",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  supervisorInvites: {
    title: "Supervisor Invites",
    href: "supervisor-invites",
    icon: "users",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  projectSubmissions: {
    title: "Project Submissions",
    href: "project-submissions",
    icon: "folder",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  preAllocatedProjects: {
    title: "Pre-Allocated Projects",
    href: "pre-allocated-projects",
    icon: "folder-lock",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  studentInvites: {
    title: "Student Invites",
    href: "student-invites",
    icon: "users",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  preferenceSubmissions: {
    title: "Preference Submissions",
    href: "preference-submissions",
    icon: "folder-heart",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  lateProposals: {
    title: "Late Proposals",
    href: "late-proposals",
    icon: "folder-clock",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  algorithms: {
    title: "Algorithms",
    href: "algorithms",
    icon: "server",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  results: {
    title: "Results",
    href: "results",
    icon: "square-kanban",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  preferenceStatistics: {
    title: "Preference Statistics",
    href: "preference-statistics",
    icon: "bar-chart",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  manualAllocations: {
    title: "Manual Allocations & Overrides",
    href: "manual-allocations",
    icon: "mouse-pointer",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  randomAllocations: {
    title: "Random Allocations",
    href: "random-allocations",
    icon: "shuffle",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  allocationOverview: {
    title: "Allocation Overview",
    href: "allocation-overview",
    icon: "folder-lock",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  manageUserAccess: {
    title: "Manage User Access",
    href: "manage-user-access",
    icon: "user-cog",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  exportToCSV: {
    title: "Export to CSV",
    href: "export-to-csv",
    icon: "file-spreadsheet",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  // pin x2
  multiRoleSupervisorTasks: {
    title: "Tasks",
    href: "supervisor-tasks",
    icon: "list-checks",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  nonAdminSupervisorTasks: {
    title: "Tasks",
    href: "supervisor-tasks",
    icon: "list-checks",
    level: 3,
    allowedRoles: [Role.SUPERVISOR],
    hasSubRoute: false,
  },

  unitsOfAssessment: {
    title: "Units of Assessment",
    href: "units-of-assessment",
    icon: "file-check-2",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: true,
  },

  markingOverview: {
    title: "Marking Overview",
    href: "marking-overview",
    icon: "file-check-2",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },

  allProjects: {
    title: "All Projects",
    href: "projects",
    icon: "folder",
    level: 4,
    allowedRoles: [Role.ADMIN, Role.READER, Role.STUDENT, Role.SUPERVISOR],
    hasSubRoute: true,
  },

  // pin x2
  instanceHome: {
    title: "Instance Home",
    href: "",
    icon: "home",
    level: 3,
    allowedRoles: [Role.ADMIN, Role.READER, Role.STUDENT, Role.SUPERVISOR],
    hasSubRoute: true,
  },
  instanceTasks: {
    title: "Tasks",
    href: "",
    icon: "list-checks",
    level: 3,
    allowedRoles: [Role.ADMIN, Role.READER, Role.STUDENT, Role.SUPERVISOR],
    hasSubRoute: true,
  },

  myProposedProjects: {
    title: "My Proposed Projects",
    href: "my-proposed-projects",
    icon: "folder",
    level: 4,
    allowedRoles: [Role.SUPERVISOR],
    hasSubRoute: false,
  },

  newProject: {
    title: "New Project",
    href: "new-project",
    icon: "file-plus-2",
    level: 4,
    allowedRoles: [Role.ADMIN, Role.SUPERVISOR],
    hasSubRoute: false,
  },

  editProject: {
    title: "Edit Project",
    href: "edit",
    icon: "pen",
    level: 5,
    allowedRoles: [Role.ADMIN, Role.SUPERVISOR],
    hasSubRoute: false,
  },
  mySupervisions: {
    title: "My Supervisions",
    href: "my-supervisions",
    icon: "folder-check",
    level: 4,
    allowedRoles: [Role.SUPERVISOR],
    hasSubRoute: false,
  },

  myPreferences: {
    title: "My Preferences",
    href: "my-preferences",
    icon: "folder-heart",
    level: 4,
    allowedRoles: [Role.STUDENT],
    hasSubRoute: false,
  },
  myAllocation: {
    title: "My Allocation",
    href: "my-allocation",
    icon: "file-check-2",
    level: 4,
    allowedRoles: [Role.STUDENT],
    hasSubRoute: false,
  },

  uploadReadings: {
    title: "Upload Readings",
    href: "upload-readings",
    icon: "file-plus-2",
    level: 4,
    allowedRoles: [Role.ADMIN],
    hasSubRoute: false,
  },
  myMarking: {
    title: "My Marking",
    href: "my-marking",
    icon: "file-check-2",
    level: 4,
    allowedRoles: [Role.SUPERVISOR, Role.READER],
    hasSubRoute: false,
  },
} satisfies Record<string, PageConfig>;

export type PageName = keyof typeof PAGES;
