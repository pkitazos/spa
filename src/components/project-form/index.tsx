"use client";

import { type UseFormReturn } from "react-hook-form";

import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import {
  type ProjectFormSubmissionDTO,
  type ProjectFormInternalStateDTO,
  type ProjectCreationContext,
} from "@/dto/project";

import { Role } from "@/db/types";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

import { MarkdownEditor } from "../markdown-editor";
import { MultiSelect } from "../ui/multi-select";

interface ProjectFormProps {
  projectCreationContext: ProjectCreationContext;
  onSubmit: (data: ProjectFormSubmissionDTO) => void;
  submissionButtonLabel: string;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  children?: React.ReactNode;
  isSubmitting?: boolean;
  form: UseFormReturn<ProjectFormInternalStateDTO>;
  showSupervisorSelector: boolean;
}

export function ProjectForm({
  projectCreationContext,
  onSubmit,
  submissionButtonLabel,
  userRole,
  children,
  form,
  isSubmitting = false,
  showSupervisorSelector = false,
}: ProjectFormProps) {
  const { flags, tags, students, supervisors } = projectCreationContext;

  const isPreAllocated = form.watch("isPreAllocated");

  const handlePreAllocatedToggle = () => {
    if (!isPreAllocated) {
      form.setValue("capacityUpperBound", 1);
      form.setValue("isPreAllocated", true);
    } else {
      form.setValue("isPreAllocated", false);
    }
  };

  const handleFormSubmit = (internalData: ProjectFormInternalStateDTO) => {
    const submissionData: ProjectFormSubmissionDTO = {
      title: internalData.title,
      description: internalData.description,
      flags: internalData.flags,
      tags: internalData.tags,
      capacityUpperBound: internalData.capacityUpperBound,
      preAllocatedStudentId:
        internalData.isPreAllocated && internalData.preAllocatedStudentId
          ? internalData.preAllocatedStudentId
          : undefined,
      supervisorId: internalData.supervisorId,
    };

    if (userRole === Role.ADMIN && !submissionData.supervisorId) {
      toast.error("Please select a supervisor for this project");
      return;
    }

    onSubmit(submissionData);
  };

  const availableStudents = students;
  const availableSupervisors = supervisors;

  const isAdmin = userRole === Role.ADMIN;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex w-full flex-col gap-6"
      >
        {/* Supervisor Selection (Admin only) */}
        {isAdmin && showSupervisorSelector && (
          <FormField
            control={form.control}
            name="supervisorId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-2xl">Supervisor</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={isSubmitting}
                        className={cn(
                          "w-[400px] justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-medium">
                              {availableSupervisors.find(
                                (s) => s.id === field.value,
                              )?.name ?? field.value}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {availableSupervisors.find(
                                (s) => s.id === field.value,
                              )?.email ?? field.value}
                            </span>
                          </div>
                        ) : (
                          "Select supervisor..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search supervisors..." />
                      <CommandEmpty>No supervisor found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {availableSupervisors.map((supervisor) => (
                          <CommandItem
                            key={supervisor.id}
                            value={`${supervisor.id} ${supervisor.name} ${supervisor.email}`}
                            onSelect={() => {
                              form.setValue("supervisorId", supervisor.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                supervisor.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <span className="text-sm font-medium truncate w-full">
                                {supervisor.name}
                              </span>
                              <span className="text-xs text-muted-foreground truncate w-full">
                                {supervisor.email}
                              </span>
                              <span className="text-xs text-muted-foreground/70">
                                ID: {supervisor.id}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the supervisor for this project
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Core Project Fields */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl">Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Project Title"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Please insert a title for this project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl">Description</FormLabel>
              <FormControl>
                <MarkdownEditor
                  {...field}
                  textareaProps={{
                    placeholder: "Type the project description here.",
                    disabled: isSubmitting,
                  }}
                />
              </FormControl>
              <FormDescription>
                Please add a description for this project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="mt-4" />

        {/* Project Attributes */}
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="flags"
            render={() => (
              <FormItem className={cn(flags.length === 0 && "hidden")}>
                <div className="mb-3">
                  <FormLabel className="text-2xl">Flags</FormLabel>
                  <FormDescription>
                    Select which students this project is suitable for. You must
                    select at least one flag.
                  </FormDescription>
                </div>
                {flags.map((flag) => (
                  <FormField
                    key={flag.id}
                    control={form.control}
                    name="flags"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={flag.id}
                          className="flex flex-row items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              disabled={isSubmitting}
                              checked={field.value?.some(
                                (f) => f.id === flag.id,
                              )}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, flag])
                                  : field.onChange(
                                      field.value?.filter(
                                        (f) => f.id !== flag.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <div>
                            <FormLabel className="text-base font-normal">
                              {flag.displayName}
                            </FormLabel>
                            <FormDescription className="text-sm">
                              {flag.description}
                            </FormDescription>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <div className="mb-1">
                  <FormLabel className="text-2xl">Keywords</FormLabel>
                  <FormDescription>
                    Select the keywords that describe this project
                  </FormDescription>
                </div>
                <FormControl className="w-full">
                  <MultiSelect
                    options={tags}
                    selected={field.value ?? []}
                    onSelectionChange={field.onChange}
                    placeholder="Select tags..."
                    className="sm:min-w-[450px]"
                  />
                </FormControl>
                <FormDescription className="mt-2">
                  Tags help students find projects that match their interests.
                  You can select multiple tags. If you need to add a new tag,
                  please contact the system administrators.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        {/* Allocation Section */}
        <FormField
          control={form.control}
          name="isPreAllocated"
          render={() => (
            <FormItem className="mb-3 flex items-center space-x-2">
              <FormControl>
                <div className="flex items-center justify-start gap-2">
                  <Switch
                    id="pre-allocated-student-id"
                    checked={isPreAllocated}
                    onCheckedChange={handlePreAllocatedToggle}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="pre-allocated-student-id">
                    Student defined project
                  </Label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          {/* Capacity Upper Bound (Admin only) */}
          {isAdmin && (
            <FormField
              control={form.control}
              name="capacityUpperBound"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={cn(
                      "text-xl",
                      isPreAllocated && "text-slate-400",
                    )}
                  >
                    Capacity Upper Bound
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPreAllocated ?? isSubmitting}
                      className="w-16"
                      placeholder="1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription
                    className={cn(isPreAllocated && "text-slate-400")}
                  >
                    The maximum number this project is suitable for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Student Selection */}
          {/* // TODO: Consider variant where field is omitted */}
          <FormField
            control={form.control}
            name="preAllocatedStudentId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel
                  className={cn("text-xl", !isPreAllocated && "text-slate-400")}
                >
                  Student
                </FormLabel>
                <Popover>
                  <PopoverTrigger
                    disabled={!isPreAllocated || isSubmitting}
                    asChild
                  >
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[400px] justify-between overflow-hidden",
                          !field.value && "text-slate-400",
                        )}
                      >
                        {field.value ? (
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-medium">
                              {availableStudents.find(
                                (s) => s.id === field.value,
                              )?.name ?? field.value}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {availableStudents.find(
                                (s) => s.id === field.value,
                              )?.email ?? field.value}
                            </span>
                          </div>
                        ) : (
                          "Select student..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {availableStudents
                          .filter((s) => {
                            const studentFlagId = s.flag.id;
                            const projectFlagIds = form
                              .getValues("flags")
                              .map((f) => f.id);
                            return projectFlagIds.includes(studentFlagId);
                          })
                          .map((student) => (
                            <CommandItem
                              className="overflow-hidden"
                              value={`${student.id} ${student.name} ${student.email}`}
                              key={student.id}
                              onSelect={() => {
                                form.setValue(
                                  "preAllocatedStudentId",
                                  student.id,
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  student.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-sm font-medium truncate w-full">
                                  {student.name}
                                </span>
                                <span className="text-xs text-muted-foreground truncate w-full">
                                  {student.email}
                                </span>
                                <span className="text-xs text-muted-foreground/70">
                                  ID: {student.id}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                      <CommandInput
                        placeholder="Search student..."
                        disabled={!isPreAllocated}
                      />
                      <CommandEmpty>No Student found.</CommandEmpty>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription
                  className={cn(!isPreAllocated && "text-slate-400")}
                >
                  This is the student which self-defined this project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="mt-16 flex justify-end gap-8">
          {children}
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {submissionButtonLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
