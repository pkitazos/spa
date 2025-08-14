"use client";

import { useEffect, useState } from "react";

import {
  format,
  getDate,
  getMonth,
  getYear,
  parse,
  setDate,
  setMonth,
  setYear,
} from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

import { Input } from "./ui/input";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function DateTimePicker({
  value: controlled,
  onChange: extOnChange,
  disabled = false,
  label = "Date and time",
  placeholder = "Select date and time",
}: DateTimePickerProps) {
  const [value, onChange] = useState(controlled);

  useEffect(() => {
    extOnChange(value);
  }, [value, extOnChange]);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "PPP 'at' HH:mm OOOO")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(v) => {
              if (!v) return;
              onChange((prev) => {
                let newDate = prev;
                newDate = setYear(newDate, getYear(v));
                newDate = setMonth(newDate, getMonth(v));
                newDate = setDate(newDate, getDate(v));

                return newDate;
              });
            }}
            initialFocus
          />
          <div className="border-t p-3 flex flex-row justify-between gap-3">
            <div className="flex flex-row items-center justify-center gap-2">
              <div className="flex flex-col justify-start space-x-2">
                <span className="text-sm font-medium">Time</span>
                <span className="self-end text-sm text-muted-foreground">
                  {format(value, "OOOO")}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={format(value, "HH:mm")}
                onChange={(e) => {
                  onChange((prev) => parse(e.target.value, "HH:mm", prev));
                }}
                type="time"
                id="time-picker"
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
