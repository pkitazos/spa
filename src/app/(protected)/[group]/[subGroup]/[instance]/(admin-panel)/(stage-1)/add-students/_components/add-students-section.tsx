"use client";
import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { UserCreationErrorCard } from "@/components/toast-card/user-creation-error";
import DataTable from "@/components/ui/data-table/data-table";
import { LabelledSeparator } from "@/components/ui/labelled-separator";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";
import { addStudentsCsvHeaders } from "@/lib/validations/add-users/csv";
import { NewStudent } from "@/lib/validations/add-users/new-user";

import { CSVUploadButton } from "./csv-upload-button";
import { FormSection } from "./form-section";
import { useNewStudentColumns } from "./new-student-columns";

import { spacesLabels } from "@/config/spaces";

export function AddStudentsSection() {
  const router = useRouter();
  const params = useInstanceParams();

  const utils = api.useUtils();

  const { data, isLoading } = api.institution.instance.getStudents.useQuery({
    params,
  });

  const refetchData = () => utils.institution.instance.getStudents.refetch();

  const { mutateAsync: addStudentAsync } =
    api.institution.instance.addStudent.useMutation();

  // TODO: handle error messages properly (add status codes or something)
  async function handleAddStudent(newStudent: NewStudent) {
    void toast.promise(
      addStudentAsync({
        params,
        newStudent,
      }).then(() => {
        router.refresh();
        refetchData();
      }),
      {
        loading: "Adding student...",
        success: `Successfully added student ${newStudent.institutionId} to ${spacesLabels.instance.short}`,
        error: (err) =>
          err instanceof TRPCClientError
            ? err.message
            : `Failed to add student to ${spacesLabels.instance.short}`,
      },
    );
  }

  const { mutateAsync: addStudentsAsync } =
    api.institution.instance.addStudents.useMutation();

  async function handleAddStudents(newStudents: NewStudent[]) {
    const res = await addStudentsAsync({ params, newStudents }).then((data) => {
      router.refresh();
      refetchData();
      return data;
    });

    if (res.successFullyAdded === 0) {
      toast.error(`No students were added to ${spacesLabels.instance.short}`);
    } else {
      toast.success(
        `Successfully added ${res.successFullyAdded} students to ${spacesLabels.instance.short}`,
      );
    }

    const errors = res.errors.reduce(
      (acc, val) => ({
        ...acc,
        [val.msg]: [...(acc[val.msg] ?? []), val.user.institutionId],
      }),
      {} as { [key: string]: string[] },
    );

    Object.entries(errors).forEach(([msg, affectedUsers]) => {
      toast.error(
        <UserCreationErrorCard error={msg} affectedUsers={affectedUsers} />,
      );
    });
  }

  const { mutateAsync: removeStudentAsync } =
    api.institution.instance.removeStudent.useMutation();

  async function handleStudentRemoval(studentId: string) {
    void toast.promise(
      removeStudentAsync({ params, studentId }).then(() => {
        router.refresh();
        refetchData();
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
      removeStudentsAsync({ params, studentIds }).then(() => {
        router.refresh();
        refetchData();
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
      {" "}
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
      <FormSection handleAddStudent={handleAddStudent} />
      <Separator className="my-14" />
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <DataTable
          searchableColumn={{ id: "Full Name", displayName: "Student Names" }}
          filters={[
            {
              title: "filter Student Level",
              columnId: "Student Level",
              options: [
                { id: "4", title: "Level 4" },
                { id: "5", title: "Level 5" },
              ],
            },
          ]}
          columns={columns}
          data={data ?? []}
        />
      )}
    </>
  );
}
