"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { type UserDTO } from "@/dto";

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

import { api } from "@/lib/trpc/client";

const userEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address").optional(),
});

export type UserEdit = z.infer<typeof userEditSchema>;

export function InlineUserEditForm({ user }: { user: UserDTO }) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { mutateAsync: updateUser } = api.institution.updateUser.useMutation();

  const form = useForm<UserEdit>({
    resolver: zodResolver(userEditSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  // Watch for changes to enable/disable save button
  const watchedValues = form.watch();

  useEffect(() => {
    const currentValues = form.getValues();
    const hasChanged =
      currentValues.name !== user.name || currentValues.email !== user.email;

    setHasChanges(hasChanged);
  }, [watchedValues, user.name, user.email, form]);

  function handleReset() {
    form.reset({ name: user.name, email: user.email });
    setHasChanges(false);
    toast.info("Changes reset to original values");
  }

  async function handleSubmit(data: UserEdit) {
    setIsSubmitting(true);

    void toast.promise(
      updateUser({
        user: {
          id: user.id,
          name: data.name ?? user.name,
          email: data.email ?? user.email,
        },
      }).then(() => {
        setHasChanges(false);
        form.reset(data);
        router.refresh();
      }),
      {
        loading: "Updating user...",
        success: "User updated successfully",
        error: "Failed to update user",
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
