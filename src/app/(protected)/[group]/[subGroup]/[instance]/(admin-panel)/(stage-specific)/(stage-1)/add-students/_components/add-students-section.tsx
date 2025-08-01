"use client";

import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { type FlagDTO, type StudentDTO } from "@/dto";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";
import { LabelledSeparator } from "@/components/ui/labelled-separator";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";
import { addStudentsCsvHeaders } from "@/lib/validations/add-users/csv";
import { type NewStudent } from "@/lib/validations/add-users/new-user";

import { CSVUploadButton } from "./csv-upload-button";
import { FormSection } from "./form-section";
import { useNewStudentColumns } from "./new-student-columns";

export function AddStudentsSection({ flags }: { flags: FlagDTO[] }) {
  const router = useRouter();
  const params = useInstanceParams();

  const { data, isLoading, refetch } =
    api.institution.instance.getStudents.useQuery({ params });

  const { mutateAsync: addStudentAsync } =
    api.institution.instance.addStudent.useMutation();

  async function handleAddStudent(data: NewStudent) {
    const flag = flags.find((f) => f.id === data.flagId);
    if (!flag) {
      toast.error("Invalid flag selected");
      return;
    }

    const newStudent: StudentDTO = {
      id: data.institutionId,
      name: data.fullName,
      email: data.email,
      flag,
      joined: false,
      latestSubmission: undefined,
    };

    void toast.promise(
      addStudentAsync({ params, newStudent }).then(async () => {
        router.refresh();
        await refetch();
      }),
      {
        loading: "Adding student...",
        success: `Successfully added student ${newStudent.id} to ${spacesLabels.instance.short}`,
        error: (err) =>
          err instanceof TRPCClientError
            ? err.message
            : `Failed to add student to ${spacesLabels.instance.short}`,
      },
    );
  }

  const { mutateAsync: addStudentsAsync } =
    api.institution.instance.addStudents.useMutation();

  async function handleAddStudents(data: NewStudent[]) {
    const newStudents: StudentDTO[] = [];

    for (const student of data) {
      const flag = flags.find((f) => f.id === student.flagId);
      if (!flag) {
        toast.error(
          `Invalid flag ID: ${student.flagId} for student ${student.institutionId}`,
        );
        continue;
      }

      newStudents.push({
        id: student.institutionId,
        name: student.fullName,
        email: student.email,
        flag,
        joined: false,
        latestSubmission: undefined,
      });
    }

    if (newStudents.length === 0) {
      toast.error("No valid students to add");
      return;
    }

    void toast.promise(
      addStudentsAsync({ params, newStudents }).then(async (result) => {
        router.refresh();
        await refetch();
        return result;
      }),
      {
        loading: `Adding ${newStudents.length} students...`,
        success: `Successfully processed ${newStudents.length} students`,
        error: (err) =>
          err instanceof TRPCClientError
            ? err.message
            : `Failed to add students to ${spacesLabels.instance.short}`,
      },
    );
  }

  const { mutateAsync: removeStudentAsync } =
    api.institution.instance.removeStudent.useMutation();

  async function handleStudentRemoval(studentId: string) {
    void toast.promise(
      removeStudentAsync({ params, studentId }).then(async () => {
        router.refresh();
        await refetch();
      }),
      {
        loading: "Removing student...",
        success: `Successfully removed student ${studentId} from ${spacesLabels.instance.short}`,
        error: `Failed to remove student from ${spacesLabels.instance.short}`,
      },
    );
  }

  const { mutateAsync: removeStudentsAsync } =
    api.institution.instance.removeStudents.useMutation();

  async function handleStudentsRemoval(studentIds: string[]) {
    void toast.promise(
      removeStudentsAsync({ params, studentIds }).then(async () => {
        router.refresh();
        await refetch();
      }),
      {
        loading: "Removing students...",
        success: `Successfully removed ${studentIds.length} students from ${spacesLabels.instance.short}`,
        error: `Failed to remove students from ${spacesLabels.instance.short}`,
      },
    );
  }

  const columns = useNewStudentColumns({
    removeStudent: handleStudentRemoval,
    removeSelectedStudents: handleStudentsRemoval,
  });

  return (
    <>
      <div className="mt-6 flex flex-col gap-6">
        <h3 className="text-xl">Upload using CSV</h3>
        <div className="flex items-center gap-6">
          <CSVUploadButton
            requiredHeaders={addStudentsCsvHeaders}
            handleUpload={handleAddStudents}
          />
          <div className="flex flex-col items-start">
            <p className="text-muted-foreground">must contain header: </p>
            <code className="text-muted-foreground">
              {addStudentsCsvHeaders.join(",")}
            </code>
          </div>
        </div>
      </div>
      <LabelledSeparator label="or" className="my-6" />
      <FormSection handleAddStudent={handleAddStudent} flags={flags} />
      <Separator className="my-14" />
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <DataTable
          filters={[
            {
              title: "filter by Flag",
              columnId: "Flag",
              options: flags.map((flag) => ({
                id: flag.displayName,
                title: flag.displayName,
              })),
            },
          ]}
          columns={columns}
          data={data ?? []}
        />
      )}
    </>
  );
}
