"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";

import { useMarkingSchemeStore } from "./store";

import { FLAG } from "@/content/config/flags";

export const formSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;

export function NewFlagForm() {
  const router = useRouter();

  const flags = useMarkingSchemeStore((s) => s.flags);
  const addFlag = useMarkingSchemeStore((s) => s.addFlag);
  const setSelectedFlag = useMarkingSchemeStore((s) => s.setSelectedFlag);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  function onSubmit(data: FormData) {
    addFlag(data);
    setSelectedFlag(flags.length);
    toast.success("Flag created successfully");
    router.push(`?flag=${data.title}`);
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center gap-6"
      >
        <div className="flex flex-col items-start gap-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-2xl">{FLAG} Title</FormLabel>
                <FormControl>
                  <Input placeholder={`${FLAG} Name`} {...field} />
                </FormControl>
                <FormDescription>
                  Please select a unique name for this {FLAG}.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-2xl">{FLAG} Description</FormLabel>
                <FormControl>
                  <Textarea placeholder={`${FLAG} Description`} {...field} />
                </FormControl>
                <FormDescription>
                  Add a brief description for this {FLAG}.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Separator className="my-14" />
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Create New {FLAG}
          </Button>
        </div>
      </form>
    </Form>
  );
}
