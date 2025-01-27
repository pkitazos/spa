"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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

import { api } from "@/lib/trpc/client";
import { slugify } from "@/lib/utils/general/slugify";
import { GroupParams } from "@/lib/validations/params";

import { spacesLabels } from "@/content/spaces";

export function FormSection({
  takenNames,
  params,
}: {
  takenNames: Set<string>;
  params: GroupParams;
}) {
  const router = useRouter();
  const FormSchema = z.object({
    subGroupName: z
      .string()
      .min(1, "Please enter a name")
      .refine((item) => !takenNames.has(item), "This name is already taken"),
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { subGroupName: "" },
  });

  const { mutateAsync: createSubGroupAsync } =
    api.institution.group.createSubGroup.useMutation();

  const onSubmit = ({ subGroupName }: { subGroupName: string }) => {
    void toast.promise(
      createSubGroupAsync({
        params,
        name: subGroupName,
      }).then(() => {
        router.push(`/${params.group}/${slugify(subGroupName)}`);
        router.refresh();
      }),
      {
        loading: `Creating new ${spacesLabels.subGroup.short}...`,
        error: "Something went wrong",
        success: `Successfully created new ${spacesLabels.subGroup.short}`,
      },
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex flex-col items-center justify-center gap-6"
      >
        <div className="flex w-1/2 flex-col items-start gap-3">
          <FormField
            control={form.control}
            name="subGroupName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-2xl">
                  {spacesLabels.subGroup.full} Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={`${spacesLabels.subGroup.short} Name`}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Please select a unique name within the{" "}
                  {spacesLabels.group.short} for this
                  {spacesLabels.subGroup.short}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Separator className="my-14" />
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Create New {spacesLabels.subGroup.short}
          </Button>
        </div>
      </form>
    </Form>
  );
}
