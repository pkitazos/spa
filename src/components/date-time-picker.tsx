"use client";

import { useState, useEffect } from "react";

import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  label = "Date and time",
  placeholder = "Select date and time",
}: DateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value);
  const [hours, setHours] = useState<string>(
    value ? format(value, "HH") : "12",
  );
  const [minutes, setMinutes] = useState<string>(
    value ? format(value, "mm") : "00",
  );

  useEffect(() => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(Number.parseInt(hours, 10));
      newDate.setMinutes(Number.parseInt(minutes, 10));
      newDate.setSeconds(0);
      onChange?.(newDate);
    }
  }, [date, hours, minutes, onChange]);

  const hoursOptions = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  const minutesOptions = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, `PPP 'at' ${hours}:${minutes}`)
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
          <div className="border-t p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={hours} onValueChange={setHours}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="Hours" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {hoursOptions.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm">:</span>
                <Select value={minutes} onValueChange={setMinutes}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="Minutes" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {minutesOptions.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
