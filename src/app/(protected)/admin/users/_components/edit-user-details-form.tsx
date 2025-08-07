"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { userDtoSchema, type UserDTO } from "@/dto";
import { Form } from "@/components/ui/form";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function EditUserDetailsForm({ user }: { user: UserDTO }) {

  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(userDtoSchema),
    defaultValues: user,
  });

  const onSubmit = useCallback((data) => {}}

  return <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>

    <Input></Input>
    </form>
  </Form>;
}
