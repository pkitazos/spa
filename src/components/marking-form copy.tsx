// "use client";
// import React from "react";
// import { useForm } from "react-hook-form";
// import { Check, ChevronsUpDown } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";

// import { cn } from "@/lib/utils";
// import {
//   AssessmentComponents,
//   UpdatedMarks,
// } from "@/lib/validations/marking-form";

// import { Checkbox } from "./ui/checkbox";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "./ui/command";
// import { Textarea } from "./ui/textarea";

// import { GRADES } from "@/config/grades";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";

// type TEMPMarkingFormData2 = {
//   marks: {
//     assessmentComponentId: string;
//     mark: number;
//     justification: string;
//   }[];
//   finalComment: string;
//   recommendation: boolean;
//   draft: boolean;
// };

// const formSchema = z.object({
//   marks: z.array(
//     z.object({
//       assessmentComponentId: z.string(),
//       mark: z.number(),
//       justification: z.string(),
//     }),
//   ),
//   finalComment: z.string(),
//   recommendation: z.boolean(),
//   draft: z.boolean(),
// });

// export function MarkingForm({
//   project,
//   onSubmit,
//   onSave,
//   flag,
//   assessmentComponents,
// }: {
//   onSubmit: (data: TEMPMarkingFormData2) => void;
//   onSave: (data: TEMPMarkingFormData2) => void;
//   project: TEMPMarkingFormData2;
//   flag: string;
//   assessmentComponents: AssessmentComponents[];
// }) {
//   const form = useForm<TEMPMarkingFormData2>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       draft: true,
//       finalComment: project.finalComment,
//       recommendation: project.recommendation,
//       marks: project.marks,
//     },
//   });

//   const [action, setAction] = React.useState<string | null>(null);

//   const handleSubmit = (data: UpdatedMarks) => {
//     if (action === "submit") {
//       onSubmit(data);
//     } else if (action === "save") {
//       onSave(data);
//     }
//   };

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(handleSubmit)}
//         className="mt-10 flex w-full max-w-5xl flex-col gap-6"
//       >
//         {assessmentComponents.map((field) => {
//           // eslint-disable-next-line react-hooks/rules-of-hooks
//           const [open, setOpen] = React.useState(false);
//           // eslint-disable-next-line react-hooks/rules-of-hooks
//           const [value, setValue] = React.useState<number | null>(null);

//           return (
//             <div key={field.layoutIndex}>
//               <div>
//                 <FormLabel htmlFor={`mark-${field.layoutIndex}`}>
//                   {field.title}
//                 </FormLabel>
//                 <FormDescription>{field.description}</FormDescription>
//               </div>
//               <br />
//               <div className="flex gap-4">
//                 <FormField
//                   control={form.control}
//                   name={`marks.${field.layoutIndex - 1}.1`}
//                   render={({ field: formField }) => (
//                     <FormItem className="flex-3">
//                       <FormControl>
//                         <Popover open={open} onOpenChange={setOpen}>
//                           <PopoverTrigger asChild>
//                             <Button
//                               variant="outline"
//                               role="combobox"
//                               aria-expanded={open}
//                               className="w-full justify-between"
//                             >
//                               {value !== null
//                                 ? GRADES.find((grade) => grade.value === value)
//                                     ?.label
//                                 : "Select grade..."}
//                               <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                             </Button>
//                           </PopoverTrigger>
//                           <PopoverContent className="w-[200px] p-0">
//                             <Command>
//                               <CommandInput placeholder="Search grade..." />
//                               <CommandList>
//                                 <CommandEmpty>No grade found.</CommandEmpty>
//                                 <CommandGroup>
//                                   {GRADES.map((grade) => (
//                                     <CommandItem
//                                       key={grade.value}
//                                       onSelect={() => {
//                                         setValue(grade.value);
//                                         formField.onChange(grade.value);
//                                         setOpen(false);
//                                       }}
//                                     >
//                                       <Check
//                                         className={cn(
//                                           "mr-2 h-4 w-4",
//                                           grade.value === value
//                                             ? "opacity-100"
//                                             : "opacity-0",
//                                         )}
//                                       />
//                                       {grade.label}
//                                     </CommandItem>
//                                   ))}
//                                 </CommandGroup>
//                               </CommandList>
//                             </Command>
//                           </PopoverContent>
//                         </Popover>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   key={field.layoutIndex}
//                   control={form.control}
//                   name={`marks.${field.layoutIndex - 1}.2`}
//                   render={() => (
//                     <FormItem className="flex-1">
//                       <FormControl>
//                         <Textarea placeholder="Justification." />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </div>
//           );
//         })}

//         <FormField
//           key={`finalComments`}
//           control={form.control}
//           name="finalComments"
//           render={() => (
//             <FormItem>
//               <FormLabel htmlFor={`finalComments`}>Comments</FormLabel>
//               <FormControl>
//                 <Textarea placeholder="Final Comments." />
//               </FormControl>
//             </FormItem>
//           )}
//         />

//         <FormField
//           key={`prize`}
//           control={form.control}
//           name="prize"
//           render={() => (
//             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
//               <FormControl>
//                 <Checkbox />
//               </FormControl>
//               <div className="space-y-1 leading-none">
//                 <FormLabel>Up For A Prize?</FormLabel>
//               </div>
//             </FormItem>
//           )}
//         />

//         <div className="mt-16 flex justify-end gap-8">
//           <Button
//             variant="outline"
//             size="lg"
//             onClick={() => setAction("save")}
//             type="submit"
//           >
//             Save
//           </Button>
//           <Button type="submit" size="lg" onClick={() => setAction("submit")}>
//             Submit Marks
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// }
