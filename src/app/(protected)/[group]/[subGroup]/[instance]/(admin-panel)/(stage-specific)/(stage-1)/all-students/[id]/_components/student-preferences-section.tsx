import { BookmarkIcon } from "lucide-react";

import { SectionHeading } from "@/components/heading";
import { StudentSavedPreferenceDataTable } from "@/components/student-saved-preferences/data-table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { api } from "@/lib/trpc/server";
import { type PageParams } from "@/lib/validations/params";

import { EditButton } from "./edit-button";
import { StudentPreferenceDataTable } from "./student-preference-data-table";

export async function StudentPreferencesSection({
  params,
}: {
  params: PageParams;
}) {
  const studentId = params.id;

  const currentBoardState = await api.user.student.preference.getAll({
    params,
    studentId,
  });

  const lastSubmission = await api.user.student.preference.getAllSaved({
    params,
    studentId,
  });

  return (
    <>
      <div className="-mb-2 mt-6 flex items-center justify-between">
        <SectionHeading icon={BookmarkIcon} className="mb-2">
          Preferences
        </SectionHeading>
        <EditButton studentId={studentId} />
      </div>

      <Tabs
        searchParamName="tab"
        options={["current-board-state", "current-board-state"]}
        defaultValue="current-board-state"
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger
            className="w-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            value="current-board-state"
          >
            Current Board State
          </TabsTrigger>
          <TabsTrigger
            className="w-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            value="last-submission"
          >
            Last Submission
          </TabsTrigger>
        </TabsList>
        <Separator className="my-4" />
        <TabsContent value="current-board-state">
          <StudentPreferenceDataTable
            data={currentBoardState}
            studentId={studentId}
          />
        </TabsContent>
        <TabsContent value="last-submission">
          <StudentSavedPreferenceDataTable data={lastSubmission} />
        </TabsContent>
      </Tabs>
    </>
  );
}
