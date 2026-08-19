import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function CaseNotFound() {
  return (
    <EmptyState
      icon={<FileQuestion className="h-5 w-5 text-text-muted" />}
      title="We couldn't find that case"
      description="It may have been removed, or it belongs to a different account."
      action={
        <Button asChild>
          <Link href="/cases">Back to Cases</Link>
        </Button>
      }
    />
  );
}
