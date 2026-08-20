import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Auth is deliberately plain (§6.1) — only the workspace and API are gated.
// Sign-in/up/forgot-password and the Inngest webhook stay public.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/cases(.*)",
  "/api/((?!inngest|webhooks).*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};