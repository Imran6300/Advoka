import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Auth is deliberately plain (§6.1) — only the workspace and API are gated.
// Sign-in/up/forgot-password and the Inngest webhook stay public.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/cases(.*)",
  "/api/((?!inngest|webhooks).*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  },
  {
    // Required because advoka-self.vercel.app is a shared vercel.app domain —
    // we can't add a CNAME for it, so Clerk's Frontend API is reverse-proxied
    // through /__clerk instead. See Clerk Dashboard → Configure → Domains.
    frontendApiProxy: {
      enabled: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Required so proxy requests actually reach clerkMiddleware
    "/__clerk/(.*)",
  ],
};