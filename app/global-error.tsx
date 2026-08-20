"use client";

// This boundary only fires if the root layout itself throws (Clerk/font/
// provider failures) — Next.js requires it to render its own <html>/<body>
// since the real root layout didn't mount. Kept deliberately plain and
// dependency-free so it can never itself fail to render.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0b0d12",
          color: "#f5f7fa",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 14, color: "#a7adbb", marginBottom: 20 }}>
            Advoka hit an unexpected error loading the app. Refreshing usually
            fixes it — your case data hasn&apos;t been affected.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#5b5bd6",
              color: "#f5f7fa",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
