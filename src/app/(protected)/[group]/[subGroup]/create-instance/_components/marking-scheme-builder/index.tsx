import { SidebarProvider } from "@/components/ui/sidebar";

import { CentrePanel } from "./_components/centre-panel";
import { SidePanel } from "./_components/side-panel";
import { MarkingSchemeStoreProvider } from "./_components/state";
import { Classification, State } from "./_components/state/store";

// TODO: this is gonna break stuff when we add the second sidebar for sure

type SearchParams = { [key: string]: string | undefined };

export async function MarkingSchemeBuilder({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const initialState = getInitialState(searchParams);

  return (
    <MarkingSchemeStoreProvider initialState={initialState}>
      <SidebarProvider className="relative">
        <div className="flex w-full">
          <SidePanel />
          <CentrePanel />
        </div>
      </SidebarProvider>
    </MarkingSchemeStoreProvider>
  );
}

function getInitialState(searchParams: SearchParams): State {
  const flags: Classification[] = []; // call trpc procedure here

  const flagIdx = flags.findIndex((f) => f.title === searchParams.flag);
  const selectedFlagIndex = flagIdx !== -1 ? flagIdx : undefined;

  if (!selectedFlagIndex) {
    return {
      flags,
      selectedFlagIndex: undefined,
      selectedSubmissionIndex: undefined,
    };
  }

  const submissionIdx = flags[selectedFlagIndex].submissions.findIndex(
    (s) => s.title === searchParams.submission,
  );

  const selectedSubmissionIndex =
    submissionIdx !== -1 ? submissionIdx : undefined;
  return { flags, selectedFlagIndex, selectedSubmissionIndex };
}
