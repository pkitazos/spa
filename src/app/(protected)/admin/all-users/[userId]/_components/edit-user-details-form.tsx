"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { INSTITUTION } from "@/config/institution";

import { userDtoSchema, type UserDTO } from "@/dto";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { api } from "@/lib/trpc/client";

export function EditUserDetailsForm({ user }: { user: UserDTO }) {
  const router = useRouter();

  const { mutateAsync: updateUser, isPending: isSubmitting } =
    api.institution.updateUser.useMutation();

  const form = useForm({
    resolver: zodResolver(userDtoSchema),
    defaultValues: user,
  });

  const hasChanges =
    form.getFieldState("email").isDirty || form.getFieldState("name").isDirty;

  function handleReset() {
    form.reset({ name: user.name, email: user.email });

    toast.info("Changes reset to original values");
  }

  async function handleSubmit(user: UserDTO) {
    void toast
      .promise(updateUser({ user }), {
        loading: "Updating user...",
        success: (data) =>
          `User ${data.name} (${data.id}) updated successfully`,
        error: "Failed to update user",
      })
      .unwrap()
      .then(() => {
        form.reset(user);
        router.refresh();
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FormItem>
            <FormLabel>{INSTITUTION.ID_NAME}</FormLabel>
            <WithTooltip tip="Sorry - Ids cannot be changed after creation">
              <Input disabled value={user.id} />
            </WithTooltip>
          </FormItem>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter user's full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter user's email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || isSubmitting}
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || isSubmitting}
            variant={hasChanges ? "default" : "secondary"}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting
              ? "Saving..."
              : hasChanges
                ? "Save Changes"
                : "No Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
