// @ts-nocheck (código da biblioteca Aceternity UI: não seguimos as regras estritas do projeto aqui)
// ADAPTADO do registro @aceternity/label: texto com token --color-text (sem dark:). Instalado à mão (conflita com ui/label do painel).
"use client";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-bold leading-none text-lp-black peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
