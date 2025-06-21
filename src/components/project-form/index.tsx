"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import { Role } from "@/db/types";
import {
  projectForm,
  ProjectFormSubmissionDTO,
  ProjectFormInitialisationDTO,
  ProjectFormInternalStateDTO,
} from "@/dto/project";

import { MarkdownEditor } from "../markdown-editor";
import { MultiSelect } from "../ui/multi-select";
import { toast } from "sonner";

interface ProjectFormProps {
  formInitialisationData: ProjectFormInitialisationDTO;
  defaultValues?: Partial<ProjectFormInternalStateDTO>;
  onSubmit: (data: ProjectFormSubmissionDTO) => void;
  submissionButtonLabel: string;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  children?: React.ReactNode;
  isSubmitting?: boolean;
}

export function ProjectForm({
  formInitialisationData,
  defaultValues,
  onSubmit,
  submissionButtonLabel,
  userRole,
  children,
  isSubmitting = false,
}: ProjectFormProps) {
  const { takenTitles, flags, tags, studentIds, supervisorIds } =
    formInitialisationData;

  const projectFormInternalStateSchema =
    projectForm.buildInternalStateSchema(takenTitles);

  const form = useForm<ProjectFormInternalStateDTO>({
    resolver: zodResolver(projectFormInternalStateSchema),
    defaultValues: {
      title: "",
      description: "",
      specialTechnicalRequirements: "",
      flags: [],
      tags: [],
      capacityUpperBound: 1,
      isPreAllocated: false,
      preAllocatedStudentId: "",
      supervisorId: "",
      ...defaultValues,
    },
  });

  const isPreAllocated = form.watch("isPreAllocated");

  const handlePreAllocatedToggle = () => {
    const newState = !isPreAllocated;

    if (newState) {
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
      specialTechnicalRequirements: internalData.specialTechnicalRequirements,
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

  const availableStudents = studentIds.map((id) => ({ id, title: id }));
  const availableSupervisors = supervisorIds.map((id) => ({ id, title: id }));

  const isAdmin = userRole === Role.ADMIN;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        {/* Supervisor Selection (Admin only) */}
        {isAdmin && (
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
                          "w-[300px] justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value || "Select supervisor..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search supervisors..." />
                      <CommandEmpty>No supervisor found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {availableSupervisors.map((supervisor) => (
                          <CommandItem
                            key={supervisor.id}
                            value={supervisor.id}
                            onSelect={() => {
                              form.setValue("supervisorId", supervisor.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                supervisor.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {supervisor.title}
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

        <FormField
          control={form.control}
          name="specialTechnicalRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl">
                Special Technical Requirements
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Type the project technical requirements here."
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Please add any special technical requirements for this project
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
                          className="flex flex-row items-start space-x-3 space-y-0"
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
                          <FormLabel className="text-base font-normal">
                            {flag.title}
                          </FormLabel>
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
                    selected={field.value || []}
                    onSelectionChange={field.onChange}
                    placeholder="Select tags..."
                    className="sm:min-w-[450px]"
                  />
                </FormControl>
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
                      disabled={isPreAllocated || isSubmitting}
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
          {/* TODO Consider variant where field is omitted */}
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
                          "w-[200px] justify-between overflow-hidden",
                          !field.value && "text-slate-400",
                        )}
                      >
                        {!field.value ? "Enter Student GUID" : field.value}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {availableStudents.map((student) => (
                          <CommandItem
                            className="overflow-hidden"
                            value={student.id}
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
                                "mr-2 h-4 w-4",
                                student.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {student.id}
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
