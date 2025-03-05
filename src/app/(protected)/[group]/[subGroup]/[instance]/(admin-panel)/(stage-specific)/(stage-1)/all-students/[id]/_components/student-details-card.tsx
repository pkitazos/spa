"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClassValue } from "clsx";
import { GraduationCapIcon, HashIcon, PenIcon, UserIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { User } from "@/lib/validations/auth";
import {
  StudentInstanceDetails,
  studentInstanceDetailsSchema,
} from "@/lib/validations/dto/student";
import { studentLevelSchema } from "@/lib/validations/student-level";

import { spacesLabels } from "@/config/spaces";

export function StudentDetailsCard({
  student,
  className,
}: {
  student: User & { level: number };
  className?: ClassValue;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") ?? false;

  const params = useInstanceParams();
  const [studentLevel, setStudentLevel] = useState(student.level);

  const form = useForm<StudentInstanceDetails>({
    resolver: zodResolver(studentInstanceDetailsSchema),
    defaultValues: { level: studentLevelSchema.parse(student.level) },
  });

  function changeEditMode(newMode: boolean) {
    if (!newMode) router.push(pathname);
    else router.push(`${pathname}?edit=true`);
  }

  const { mutateAsync } = api.user.student.updateLevel.useMutation();

  function onSubmit(data: StudentInstanceDetails) {
    void toast.promise(
      mutateAsync({ params, studentId: student.id, level: data.level }).then(
        (s) => {
          setStudentLevel(s.level);
          changeEditMode(false);
        },
      ),
      {
        loading: `Updating student ${spacesLabels.instance.short} level...`,
        success: `Successfully updated student ${spacesLabels.instance.short} level`,
        error: "Something went wrong",
      },
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-4">
        <CardTitle className="group text-xl hover:cursor-pointer hover:text-primary">
          <WithTooltip tip="Edit Student Level">
            <button
              className="flex items-center gap-3 "
              onClick={() => changeEditMode(!editMode)}
            >
              <p className="group-hover:underline group-hover:underline-offset-2">
                User Info
              </p>
              <PenIcon className="h-4 w-4" />
            </button>
          </WithTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col justify-evenly gap-4">
          <div className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="mr-2 font-semibold">ID:</span>
            {student.id}
          </div>
          <div className="flex items-center">
            <HashIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="mr-2 font-semibold">Email:</span>
            {student.email}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center">
                        <GraduationCapIcon className="mr-2 h-4 w-4 opacity-70" />
                        <span className="mr-2 font-semibold">Level:</span>
                        {editMode ? (
                          <Input className="w-10" {...field} />
                        ) : (
                          <p>{studentLevel}</p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editMode && (
                <div className="flex w-full items-center justify-center gap-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    type="button"
                    onClick={() => changeEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="w-full" type="submit">
                    Submit
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
