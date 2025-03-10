import { format as dFormat } from "date-fns";

export function format(date: Date): string {
  return dFormat(date, "dd/MM/yyyy - HH:mm");
}
