"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function CreateCaseButton() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() =>
        toast({
          title: "Case creation is next",
          description: "Full case CRUD and the dashboard lands on Day 2 of the build.",
        })
      }
    >
      <Plus className="h-4 w-4" />
      Create New Case
    </Button>
  );
}
