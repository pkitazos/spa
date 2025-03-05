"use client";
import { createContext, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

import { computeUpdatedRank } from "@/lib/utils/sorting/compute-updated-rank";
import {
  PreferenceBoard,
  ProjectPreferenceCardDto,
} from "@/lib/validations/board";
import { PreferenceType } from "@/db/types";

interface KanbanBoardProps {
  projects: PreferenceBoard;
}

interface KanbanBoardState extends KanbanBoardProps {
  deleteProject: (projectId: string) => void;
  addProject: (
    project: ProjectPreferenceCardDto,
    columnId: PreferenceType,
  ) => void;
  moveProject: (
    from: { columnId: PreferenceType; idx: number },
    to: { columnId: PreferenceType; idx?: number },
  ) => ProjectPreferenceCardDto;
}

type BoardDetailsStore = ReturnType<typeof createBoardDetailsStore>;

const createBoardDetailsStore = (initProps?: Partial<KanbanBoardProps>) => {
  const DEFAULT_PROPS: KanbanBoardProps = {
    projects: {
      [PreferenceType.PREFERENCE]: [],
      [PreferenceType.SHORTLIST]: [],
    },
  };

  return createStore<KanbanBoardState>()((set, get) => ({
    ...DEFAULT_PROPS,
    ...initProps,

    addProject: (project: ProjectPreferenceCardDto, columnId: PreferenceType) =>
      set(({ projects }) => ({
        projects: { ...projects, [columnId]: [...projects[columnId], project] },
      })),

    deleteProject: (projectId: string) =>
      set(({ projects: { PREFERENCE, SHORTLIST } }) => ({
        projects: {
          PREFERENCE: PREFERENCE.filter((p) => p.id !== projectId),
          SHORTLIST: SHORTLIST.filter((p) => p.id !== projectId),
        },
      })),

    moveProject: (from, to) => {
      set(({ projects }) => {
        const clone = structuredClone(projects);
        const targetIdx = to.idx ?? clone[to.columnId].length;

        const [project] = clone[from.columnId].splice(from.idx, 1);

        project.columnId = to.columnId;
        project.rank = computeUpdatedRank(clone[to.columnId], targetIdx);

        clone[to.columnId].splice(targetIdx, 0, project);

        return { projects: clone };
      });

      return get().projects[to.columnId].at(to.idx ?? -1)!;
    },
  }));
};

const KanbanBoardContext = createContext<BoardDetailsStore | null>(null);

export function BoardDetailsProvider({
  children,
  ...props
}: React.PropsWithChildren<KanbanBoardProps>) {
  const storeRef = useRef<BoardDetailsStore>();
  if (!storeRef.current) {
    storeRef.current = createBoardDetailsStore(props);
  }

  return (
    <KanbanBoardContext.Provider value={storeRef.current}>
      {children}
    </KanbanBoardContext.Provider>
  );
}

export function useBoardDetails<T>(
  selector: (state: KanbanBoardState) => T,
): T {
  const store = useContext(KanbanBoardContext);
  if (!store) {
    throw new Error("Missing BoardDetailsProvider in the tree");
  }

  return useStore(store, selector);
}
