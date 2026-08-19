"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CASE_TYPES } from "@/lib/cases/constants";

const EMPTY_FORM = {
  title: "",
  caseType: "",
  clientName: "",
  opposingParty: "",
  importantDate: "",
};

/**
 * The single primary CTA on the dashboard and case list (§17 Buttons — one
 * dominant action, not three). Reused wherever "Create New Case" appears.
 */
export function CreateCaseDialog({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function update<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.clientName.trim() || !form.caseType) {
      toast({
        title: "A few details are missing",
        description: "Case name, case type, and client name are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "We couldn't create the case. Please try again.");
      }

      toast({ title: "Case created", description: `${form.title} is ready for documents.` });
      setOpen(false);
      setForm(EMPTY_FORM);
      router.push(`/cases/${data.case._id}`);
      router.refresh();
    } catch (err) {
      toast({
        title: "We couldn't create the case",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setForm(EMPTY_FORM);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus className="h-4 w-4" />
          Create New Case
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Create a new case</DialogTitle>
            <DialogDescription>
              Advoka will start building case intelligence the moment you upload documents.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Case name</Label>
              <Input
                id="title"
                placeholder="e.g. Sharma v. Patel Constructions"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caseType">Case type</Label>
              <Select
                id="caseType"
                value={form.caseType}
                onChange={(e) => update("caseType", e.target.value)}
              >
                <option value="" disabled>
                  Select a case type
                </option>
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="clientName">Client name</Label>
                <Input
                  id="clientName"
                  placeholder="Client"
                  value={form.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="opposingParty">Opposing party</Label>
                <Input
                  id="opposingParty"
                  placeholder="Optional"
                  value={form.opposingParty}
                  onChange={(e) => update("opposingParty", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="importantDate">Important date</Label>
              <Input
                id="importantDate"
                type="date"
                value={form.importantDate}
                onChange={(e) => update("importantDate", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create Case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
