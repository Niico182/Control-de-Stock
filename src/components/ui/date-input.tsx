"use client";

import { useRef, useState } from "react";
import { Calendar } from "lucide-react";
import {
  argDateToIso,
  formatArgDateInput,
  isoDateToArg,
} from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DateInputProps = {
  id: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
};

export function DateInput({ id, name, required, defaultValue }: DateInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const isoValue = argDateToIso(value);

  function openPicker() {
    const picker = pickerRef.current;

    if (!picker) {
      return;
    }

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }

    picker.focus();
    picker.click();
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        <Input
          id={id}
          name={name}
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          value={value}
          onChange={(event) => setValue(formatArgDateInput(event.target.value))}
          required={required}
          autoComplete="off"
          className="w-[10.75rem] tabular-nums"
        />
        <input
          ref={pickerRef}
          type="date"
          value={isoValue}
          onChange={(event) => {
            const argDate = isoDateToArg(event.target.value);
            if (argDate) {
              setValue(argDate);
            }
          }}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={openPicker}
        className="h-10 shrink-0 px-3"
        aria-label="Abrir calendario"
        title="Abrir calendario"
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  );
}
