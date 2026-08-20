import { NextRequest, NextResponse } from "next/server";

// Manually proxies requests to Clerk's Frontend API so advoka-self.vercel.app
// can serve as the Clerk domain without a CNAME (not possible on *.vercel.app).
// Equivalent to Clerk's built-in frontendApiProxy option, which requires
// @clerk/nextjs v7 + Next.js >=15.2.3 — written manually here since this repo
// is on @clerk/nextjs v6 + Next.js 14.
//
// Mirrors the nginx example in Clerk's docs:
// https://clerk.com/docs/guides/dashboard/dns-domains/proxy-fapi

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";

async function proxy(req: NextRequest, path: string[]) {
  const targetUrl = new URL(`${CLERK_FRONTEND_API}/${path.join("/")}`);
  targetUrl.search = req.nextUrl.search;

  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.delete("host");
  forwardHeaders.delete("connection");

  // Identifies this instance to Clerk and tells it what public URL
  // it's being proxied through — required on every proxied request.
  forwardHeaders.set(
    "Clerk-Proxy-Url",
    `${req.nextUrl.protocol}//${req.nextUrl.host}/__clerk`
  );
  forwardHeaders.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY ?? "");
  forwardHeaders.set(
    "X-Forwarded-For",
    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? ""
  );

  const hasBody = !["GET", "HEAD"].includes(req.method);

  const upstreamRes = await fetch(targetUrl.toString(), {
    method: req.method,
    headers: forwardHeaders,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: { clerkPath: string[] } }) {
  return proxy(req, params.clerkPath);
}
export async function POST(req: NextRequest, { params }: { params: { clerkPath: string[] } }) {
  return proxy(req, params.clerkPath);
}
export async function PUT(req: NextRequest, { params }: { params: { clerkPath: string[] } }) {
  return proxy(req, params.clerkPath);
}
export async function PATCH(req: NextRequest, { params }: { params: { clerkPath: string[] } }) {
  return proxy(req, params.clerkPath);
}
export async function DELETE(req: NextRequest, { params }: { params: { clerkPath: string[] } }) {
  return proxy(req, params.clerkPath);
}
export async function OPTIONS(req: NextRequest, { params }: { params: { clerkPath: string[] } }) {
  return proxy(req, params.clerkPath);
}