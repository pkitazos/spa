"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag, Tag } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { TagInput, TagType } from "@/components/tag/tag-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import {
  CurrentProjectFormDetails,
  UpdatedProjectFormDetails,
  updatedProjectFormDetailsSchema,
} from "@/lib/validations/project";

import { ProjectRemovalButton } from "./project-removal-button";

export function EditProjectForm({
  flags,
  tags,
  // students,
  project,
}: {
  flags: Pick<Flag, "id" | "title">[];
  tags: TagType[];
  students: { id: string }[];
  project: CurrentProjectFormDetails;
}) {
  const params = useInstanceParams();
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const [selectedTags, setSelectedTags] = useState<TagType[]>(project.tags);
  // const [preAllocated, setPreAllocated] = useState(
  //   project.preAllocatedStudentId !== "",
  // );

  const form = useForm<UpdatedProjectFormDetails>({
    resolver: zodResolver(updatedProjectFormDetailsSchema),
    defaultValues: {
      title: project.title,
      description: project.description,
      // capacityUpperBound: project.capacityUpperBound,
      // preAllocatedStudentId: project.preAllocatedStudentId,
      flagIds: project.flags.map(({ id }) => id),
      tags: project.tags,
    },
  });

  const { mutateAsync } = api.project.updateProjectDetails.useMutation();

  function onSubmit(data: UpdatedProjectFormDetails) {
    void toast.promise(
      mutateAsync({
        params,
        projectId: project.id,
        updatedProject: data,
      }).then(() => {
        router.push(`${instancePath}/projects/${project.id}`);
        router.refresh();
      }),
      {
        loading: `Updating Project ${project.id}...`,
        error: "Something went wrong",
        success: `Successfully updated Project ${project.id}`,
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl">Title</FormLabel>
              <FormControl>
                <Input placeholder="Project Title" {...field} />
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
                <Textarea
                  placeholder="Type the project description here."
                  {...field}
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
        <div className="grid grid-cols-2">
          <FormField
            control={form.control}
            name="flagIds"
            render={() => (
              <FormItem>
                <div className="mb-3">
                  <FormLabel className="text-2xl">Flags</FormLabel>
                  <FormDescription>
                    Select which students this project is suitable
                  </FormDescription>
                </div>
                {flags.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="flagIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id,
                                      ),
                                    );
                              }}
                              {...field.ref}
                            />
                          </FormControl>
                          <FormLabel className="text-base font-normal">
                            {item.title}
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
                  <FormLabel className="text-2xl">Tags</FormLabel>
                  <FormDescription>
                    Select the tags that describe this project
                  </FormDescription>
                </div>
                <FormControl className="w-full">
                  <TagInput
                    placeholder="Enter a tag"
                    autocompleteOptions={tags}
                    tags={selectedTags}
                    inputFieldPosition="top"
                    setTags={(newTags) => {
                      setSelectedTags(newTags);
                      form.setValue("tags", newTags as [Tag, ...Tag[]]);
                    }}
                    className="sm:min-w-[450px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />
        {/* 
        <div className="mb-3 flex items-center space-x-2">
          <Switch
            id="airplane-mode"
            onCheckedChange={() => setPreAllocated(!preAllocated)}
          />
          <Label htmlFor="airplane-mode">Student defined project</Label>
        </div> */}

        {/* <div className="grid grid-cols-2">
          <FormField
            control={form.control}
            name="capacityUpperBound"
            disabled={preAllocated}
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  className={cn("text-xl", preAllocated && "text-slate-400")}
                >
                  Capacity Upper Bound
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-16"
                    placeholder="1"
                    defaultValue={field.value}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The maximum number this project is suitable for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preAllocatedStudentId"
            disabled={!preAllocated}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel
                  className={cn("text-xl", !preAllocated && "text-slate-400")}
                >
                  Student
                </FormLabel>
                <Popover>
                  <PopoverTrigger disabled={!preAllocated} asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[200px] justify-between overflow-hidden",
                          !field.value && "text-slate-400",
                        )}
                      >
                        {field.value
                          ? students.find(
                              (student) => student.id === field.value,
                            )?.id
                          : "Enter Student ID"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search student..." />
                      <CommandEmpty>No Student found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((student) => (
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
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  This is the student which self-defined this project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div> */}

        <Separator className="my-14" />
        <div className="flex justify-end gap-8">
          <ProjectRemovalButton projectId={project.id} />
          <Button type="submit" size="lg">
            Update Project
          </Button>
        </div>
      </form>
    </Form>
  );
}
