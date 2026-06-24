import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { LEAD_SOURCES, LEAD_STATUSES, type Lead, type LeadSource, type LeadStatus } from "@/types";

export interface LeadFormValues {
  name: string;
  mobile: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  nextFollowUp?: string;
  notes?: string;
}

const empty: LeadFormValues = {
  name: "",
  mobile: "",
  email: "",
  source: "LinkedIn",
  status: "New Lead",
  nextFollowUp: "",
  notes: "",
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateMobile(mobile: string): boolean {
  return /^[+]?[\d\s\-().]{7,15}$/.test(mobile.trim());
}

export function LeadFormDialog({
  open, onOpenChange, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Lead | null;
  onSubmit: (v: LeadFormValues) => void;
}) {
  const [v, setV] = useState<LeadFormValues>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setV(initial ? {
        name: initial.name,
        mobile: initial.mobile,
        email: initial.email,
        source: initial.source,
        status: initial.status,
        nextFollowUp: initial.nextFollowUp?.slice(0, 10) ?? "",
        notes: initial.notes ?? "",
      } : empty);
    }
  }, [open, initial]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormValues, string>> = {};
    if (!v.name.trim()) newErrors.name = "Name is required";
    if (!v.mobile.trim()) {
      newErrors.mobile = "Mobile is required";
    } else if (!validateMobile(v.mobile)) {
      newErrors.mobile = "Enter a valid mobile number";
    }
    if (!v.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(v.email)) {
      newErrors.email = "Enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...v,
      nextFollowUp: v.nextFollowUp ? new Date(v.nextFollowUp).toISOString() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update the lead details below." : "Capture a new lead in seconds."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <Field label="Lead Name" required error={errors.name}>
            <input
              value={v.name}
              onChange={(e) => setV({ ...v, name: e.target.value })}
              className={inputCls(!!errors.name)}
              placeholder="Contact name"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile" required error={errors.mobile}>
              <input
                value={v.mobile}
                onChange={(e) => setV({ ...v, mobile: e.target.value })}
                className={inputCls(!!errors.mobile)}
                placeholder="+91 99999 99999"
              />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input
                type="email"
                value={v.email}
                onChange={(e) => setV({ ...v, email: e.target.value })}
                className={inputCls(!!errors.email)}
                placeholder="contact@company.com"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Source">
              <select
                value={v.source}
                onChange={(e) => setV({ ...v, source: e.target.value as LeadSource })}
                className={inputCls(false)}
              >
                {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={v.status}
                onChange={(e) => setV({ ...v, status: e.target.value as LeadStatus })}
                className={inputCls(false)}
              >
                {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Next Follow Up">
              <input
                type="date"
                value={v.nextFollowUp ?? ""}
                onChange={(e) => setV({ ...v, nextFollowUp: e.target.value })}
                className={inputCls(false)}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              rows={3}
              value={v.notes ?? ""}
              onChange={(e) => setV({ ...v, notes: e.target.value })}
              className={`${inputCls(false)} resize-none py-2`}
              placeholder="Add context, objections, next steps…"
            />
          </Field>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <i className="fa-solid fa-check" /> {initial ? "Save changes" : "Add Lead"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputCls = (hasError: boolean) =>
  `h-10 w-full rounded-lg border ${hasError ? "border-destructive" : "border-border"} bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary`;

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}