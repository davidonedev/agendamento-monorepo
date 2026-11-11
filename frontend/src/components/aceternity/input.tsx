// @ts-nocheck (código da biblioteca Aceternity UI: não seguimos as regras estritas do projeto aqui)
// ADAPTADO do registro @aceternity/input: brilho de hover com --color-primary (era blue-500), fundo/texto/borda
// com tokens lp-*, estado `invalid` (danger) e foco visível. Instalado à mão porque o registro grava em
// components/ui/input.tsx (sobrescreveria o input do painel). Reaplicar se reinstalar.
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Campo com erro: brilho e foco em vermelho funcional (--color-danger). */
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => {
    const radius = 100;
    const [visible, setVisible] = React.useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
    const glow = invalid ? "rgb(var(--color-danger))" : "rgb(var(--color-primary))";
    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
          ${glow},
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className={cn("group/input rounded-xl p-[2px] transition duration-300", invalid && "bg-lp-danger/40")}
      >
        <input
          type={type}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-12 w-full rounded-[10px] border-none bg-lp-alt px-4 py-2 text-sm text-lp-black shadow-input transition duration-300 placeholder:text-lp-muted group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            invalid ? "focus-visible:ring-lp-danger" : "focus-visible:ring-lp-primary",
            className,
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  },
);
Input.displayName = "Input";

export { Input };
