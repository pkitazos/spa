"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpToLineIcon, PenIcon, TargetIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
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
import { User } from "@/lib/validations/auth";
import {
  supervisorCapacitiesSchema,
  SupervisorInstanceCapacities,
} from "@/lib/validations/supervisor-project-submission-details";

import { spacesLabels } from "@/content/spaces";

export function InstanceDetailsCard({
  supervisor,
}: {
  supervisor: User & SupervisorInstanceCapacities;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") ?? false;

  const params = useInstanceParams();
  const [capacities, setCapacities] =
    useState<SupervisorInstanceCapacities>(supervisor);

  const form = useForm<SupervisorInstanceCapacities>({
    resolver: zodResolver(supervisorCapacitiesSchema),
    defaultValues: capacities,
  });

  function changeEditMode(newMode: boolean) {
    if (!newMode) router.push(pathname);
    else router.push(`${pathname}?edit=true`);
  }

  const { mutateAsync } =
    api.user.supervisor.updateInstanceCapacities.useMutation();

  function onSubmit(data: SupervisorInstanceCapacities) {
    void toast.promise(
      mutateAsync({
        params,
        supervisorId: supervisor.id,
        capacities: data,
      }).then((newCapacities) => {
        setCapacities(newCapacities);
        changeEditMode(false);
      }),
      {
        loading: `Updating supervisor ${spacesLabels.instance.short} capacities...`,
        success: `Successfully updated supervisor ${spacesLabels.instance.short} capacities`,
        error: "Something went wrong",
      },
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="group text-xl hover:cursor-pointer hover:text-primary">
          <WithTooltip tip="Edit Target and Upper Quota">
            <button
              className="flex items-center gap-3 "
              onClick={() => changeEditMode(!editMode)}
            >
              <p className="group-hover:underline group-hover:underline-offset-2">
                Supervisor capacities
              </p>
              <PenIcon className="h-4 w-4" />
            </button>
          </WithTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="projectTarget"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center">
                      <TargetIcon className="mr-2 h-4 w-4 opacity-70" />
                      <span className="mr-2 font-semibold">Target:</span>
                      {editMode ? (
                        <Input className="w-10" {...field} />
                      ) : (
                        <Badge variant="accent">
                          {capacities.projectTarget}
                        </Badge>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectUpperQuota"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center">
                      <ArrowUpToLineIcon className="mr-2 h-4 w-4 opacity-70" />
                      <span className="mr-2 font-semibold">Upper Quota:</span>
                      {editMode ? (
                        <Input className="w-10" {...field} />
                      ) : (
                        <Badge variant="accent">
                          {capacities.projectUpperQuota}
                        </Badge>
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
      </CardContent>
    </Card>
  );
}
