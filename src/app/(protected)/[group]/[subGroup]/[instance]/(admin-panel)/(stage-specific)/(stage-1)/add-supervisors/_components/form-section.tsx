import { useForm } from "react-hook-form";

import {
  type NewSupervisor,
  newSupervisorSchema,
} from "@/app/(protected)/[group]/[subGroup]/[instance]/(admin-panel)/(stage-specific)/(stage-1)/add-supervisors/_components/new-supervisor-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TextCursorInputIcon } from "lucide-react";

import { INSTITUTION } from "@/config/institution";

import { SectionHeading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const blankSupervisorForm = {
  fullName: "",
  institutionId: "",
  email: "",
  projectTarget: "" as unknown as number,
  projectUpperQuota: "" as unknown as number,
};

// TODO: refactor csv upload to use more standard data shapes
export function FormSection({
  handleAddSupervisor,
}: {
  handleAddSupervisor: (newSupervisor: NewSupervisor) => Promise<void>;
}) {
  const form = useForm<NewSupervisor>({
    resolver: zodResolver(newSupervisorSchema),
    defaultValues: blankSupervisorForm,
  });

  async function onSubmit(data: NewSupervisor) {
    await handleAddSupervisor(data).then(() => {
      form.reset(blankSupervisorForm);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col items-start gap-3"
      >
        <SectionHeading icon={TextCursorInputIcon} className="mb-2">
          Manually create Supervisor
        </SectionHeading>
        <div className="flex w-full items-center justify-start gap-5">
          {/* // TODO: don't allow special characters */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="w-1/4">
                <FormControl>
                  <Input placeholder="Full Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="institutionId"
            render={({ field }) => (
              <FormItem className="w-1/6">
                <FormControl>
                  <Input placeholder={INSTITUTION.ID_NAME} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-1/4">
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projectTarget"
            render={({ field }) => (
              <FormItem className="w-1/6">
                <FormControl>
                  <Input placeholder="Target" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projectUpperQuota"
            render={({ field }) => (
              <FormItem className="w-1/6">
                <FormControl>
                  <Input placeholder="Upper Quota" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button size="icon" variant="secondary">
            <Plus className="h-4 w-4 stroke-white stroke-3" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
