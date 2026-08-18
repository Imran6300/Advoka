import { UserProfile } from "@clerk/nextjs";
import { PageHeader } from "@/components/shell/page-header";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Manage your account and profile." />
      <div className="flex justify-center">
        <UserProfile
          appearance={{
            variables: {
              colorPrimary: "#5B5BD6",
              colorBackground: "#0B0D12",
              colorInputBackground: "#171B24",
              colorText: "#F5F7FA",
              colorTextSecondary: "#A7ADBB",
              borderRadius: "8px",
            },
            elements: {
              card: "bg-surface border border-border shadow-none",
              navbar: "bg-surface",
              rootBox: "w-full",
            },
          }}
        />
      </div>
    </div>
  );
}
