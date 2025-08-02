import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

import { INSTITUTION } from "@/config/institution";

import { type FlagDTO } from "@/dto";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type NewStudent,
  buildNewStudentSchema,
} from "@/lib/validations/add-users/new-user";

const blankStudentForm = {
  fullName: "",
  institutionId: "",
  email: "",
  flagId: "",
};

export function FormSection({
  handleAddStudent,
  flags,
}: {
  handleAddStudent: (newStudent: NewStudent) => Promise<void>;
  flags: FlagDTO[];
}) {
  const form = useForm<NewStudent>({
    resolver: zodResolver(buildNewStudentSchema(flags)),
    defaultValues: blankStudentForm,
  });

  async function onSubmit(data: NewStudent) {
    await handleAddStudent(data).then(() => {
      form.reset(blankStudentForm);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col items-start gap-3"
      >
        <h3 className="text-xl">Manually create Student</h3>
        <div className="flex w-full items-center justify-start gap-5">
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
              <FormItem className="w-1/3">
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="flagId"
            render={({ field }) => (
              <FormItem className="w-1/4">
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flag" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {flags.map((flag) => (
                      <SelectItem key={flag.id} value={flag.id}>
                        {flag.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button size="icon" variant="secondary">
            <Plus className="h-4 w-4 stroke-white stroke-[3]" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
