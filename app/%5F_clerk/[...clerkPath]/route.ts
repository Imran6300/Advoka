import { NextRequest, NextResponse } from "next/server";

// Manually proxies requests to Clerk's Frontend API so advoka-self.vercel.app
// can serve as the Clerk domain without a CNAME (not possible on *.vercel.app).
//
// IMPORTANT: this folder is named "%5F_clerk" (URL-encoded leading underscore),
// NOT "__clerk". Next.js App Router treats any folder starting with a literal
// "_" as a private folder and excludes it from routing entirely — which is
// why the plain "__clerk" folder never showed up in the build's route list.
// "%5F" decodes to "_" in the URL but isn't treated as the private-folder
// prefix by Next's router, so this still resolves to the public /__clerk/*
// path Clerk expects.
// https://nextjs.org/docs/app/building-your-application/routing#private-folders

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";

async function proxy(req: NextRequest, path: string[]) {
  const targetUrl = new URL(`${CLERK_FRONTEND_API}/${path.join("/")}`);
  targetUrl.search = req.nextUrl.search;

  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.delete("host");
  forwardHeaders.delete("connection");

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