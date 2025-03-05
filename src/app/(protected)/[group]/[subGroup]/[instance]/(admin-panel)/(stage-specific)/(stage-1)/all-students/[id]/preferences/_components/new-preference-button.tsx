"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PreferenceType } from "@prisma/client";
import { ClassValue } from "clsx";
import { Check, ChevronsUpDown, PlusIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useBoardDetails } from "@/components/kanban-board/store";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  NewProjectPreferenceDto,
  newProjectPreferenceDtoSchema,
} from "@/lib/validations/dto/preference";
import { NewStudentProjectDto } from "@/lib/validations/dto/project";
import { PageParams } from "@/lib/validations/params";

export function NewPreferenceButton({
  availableProjects,
  className,
}: {
  availableProjects: NewStudentProjectDto[];
  className?: ClassValue;
}) {
  const params = useParams<PageParams>();
  const router = useRouter();
  const addProject = useBoardDetails((s) => s.addProject);
  const [open, setOpen] = useState(false);

  const form = useForm<NewProjectPreferenceDto>({
    resolver: zodResolver(newProjectPreferenceDtoSchema),
    defaultValues: {
      preferenceType: PreferenceType.PREFERENCE,
    },
  });

  const { mutateAsync: updatePreferencesAsync } =
    api.user.student.preference.makeUpdate.useMutation();

  function onSubmit(data: NewProjectPreferenceDto) {
    const listType =
      data.preferenceType === PreferenceType.PREFERENCE
        ? "preference list"
        : "shortlist";

    void toast.promise(
      updatePreferencesAsync({
        params,
        studentId: params.id,
        projectId: data.projectId,
        preferenceType: data.preferenceType,
      }).then((projects) => {
        const columnId = data.preferenceType;
        const i = projects[columnId].findIndex((p) => p.id === data.projectId);
        addProject(projects[columnId][i], columnId);
        form.reset();
        router.refresh();
        setOpen(false);
      }),
      {
        loading: `Adding project to student's ${listType}...`,
        success: `Successfully added project to student's ${listType}`,
        error: `Failed to add project to student's ${listType}`,
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          type="button"
          variant="outline"
          className={cn("flex items-center", className)}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-max">
        <DialogHeader className="mb-4">
          <DialogTitle>New Preference</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-start gap-6">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="flex w-96 flex-col">
                    <FormLabel>Choose a Project</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[250px] justify-between overflow-hidden",
                              !field.value && "text-slate-400",
                            )}
                          >
                            {field.value === "" || !field.value
                              ? "Enter Project ID or Title"
                              : field.value}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0">
                        <Command>
                          <CommandInput placeholder="Search Project..." />
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {availableProjects.map((project) => (
                              <CommandItem
                                className="overflow-hidden"
                                value={`${project.id} - ${project.title}`}
                                key={project.id}
                                onSelect={() => {
                                  form.setValue("projectId", project.id);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    project.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <p>
                                  {project.title}{" "}
                                  <span className="text-muted-foreground">
                                    [{project.id}]
                                  </span>
                                </p>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandEmpty>No Project found.</CommandEmpty>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      This is the Project you wish to add to this student&apos;s
                      shortlist or preference list
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferenceType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Choose Preference type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={PreferenceType.PREFERENCE} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Preference{" "}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={PreferenceType.SHORTLIST} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Shortlist
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                className="w-32"
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button className="w-32" type="submit">
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
