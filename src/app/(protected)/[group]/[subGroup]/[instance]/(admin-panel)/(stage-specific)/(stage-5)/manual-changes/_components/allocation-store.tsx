"use client";
import { createContext, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

import {
  ProjectInfo,
  StudentRow,
  SupervisorDetails,
} from "@/lib/validations/allocation-adjustment";

interface AllocDetailsProps {
  projects: ProjectInfo[];
  studentsBackup: StudentRow[];
  students: StudentRow[];
  supervisors: SupervisorDetails[];
  selectedStudentIds: string[];
}

interface AllocDetailsState extends AllocDetailsProps {
  setSelectedStudentIds: (ids: string[]) => void;
  updateProjects: (projects: ProjectInfo[]) => void;
  updateStudents: (students: StudentRow[]) => void;
}

type AllocDetailsStore = ReturnType<typeof createAllocDetailsStore>;

const createAllocDetailsStore = (initProps?: Partial<AllocDetailsProps>) => {
  const DEFAULT_PROPS: AllocDetailsProps = {
    studentsBackup: [],
    projects: [],
    students: [],
    supervisors: [],
    selectedStudentIds: [],
  };

  return createStore<AllocDetailsState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setSelectedStudentIds: (val) => set(() => ({ selectedStudentIds: val })),
    updateProjects: (projects) => set(() => ({ projects })),
    updateStudents: (students) => set(() => ({ students })),
  }));
};

// context stuff

const AllocDetailsContext = createContext<AllocDetailsStore | null>(null);

export function AllocDetailsProvider({
  children,
  ...props
}: React.PropsWithChildren<AllocDetailsProps>) {
  const storeRef = useRef<AllocDetailsStore>();
  if (!storeRef.current) {
    storeRef.current = createAllocDetailsStore(props);
  }

  return (
    <AllocDetailsContext.Provider value={storeRef.current}>
      {children}
    </AllocDetailsContext.Provider>
  );
}

export function useAllocDetails<T>(
  selector: (state: AllocDetailsState) => T,
): T {
  const store = useContext(AllocDetailsContext);
  if (!store) {
    throw new Error("Missing AllocDetailsContext.Provider in the tree");
  }

  return useStore(store, selector);
}
