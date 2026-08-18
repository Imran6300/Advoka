import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/shell/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
