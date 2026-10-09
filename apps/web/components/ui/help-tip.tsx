"use client";

import { useId, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "./button";

/** Short supplementary help, available by mouse, keyboard and touch. */
export function HelpTip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <span className="help-tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <Button type="button" variant="ghost" size="icon" className="help-tip-trigger" aria-label={label}
      aria-describedby={open ? id : undefined} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onClick={() => setOpen(true)} onKeyDown={event => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); } }}>
      <CircleHelp size={15} aria-hidden="true"/>
    </Button>
    <span id={id} role="tooltip" hidden={!open} className="help-tip-content">{children}</span>
  </span>;
}
