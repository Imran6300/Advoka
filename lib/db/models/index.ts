/**
 * Side-effect-only barrel: importing this file guarantees every Mongoose
 * model in the app is registered, regardless of which specific models a
 * given route/query file imports directly.
 *
 * Why this exists: Next.js bundles each API route as its own isolated
 * serverless function containing only the modules that route's import
 * graph actually touches. `mongoose.model(name, schema)` only registers a
 * model when its defining file is evaluated — so a route that calls
 * `.populate("someRef")` for a model it never imports directly (e.g. the
 * graph route populating "Document" via CaseFact/Contradiction/GraphEdge,
 * none of which import Document.ts themselves) throws
 * `MissingSchemaError: Schema hasn't been registered for model "X"` in
 * production, even though the same code works locally once you've hit a
 * route that happens to import it and warmed the dev server's module cache.
 *
 * Fix: `connectDB()` imports this file, so every request that connects to
 * the DB registers the full model set first.
 */
import "@/lib/db/models/User";
import "@/lib/db/models/Case";
import "@/lib/db/models/Document";
import "@/lib/db/models/DocumentChunk";
import "@/lib/db/models/CaseFact";
import "@/lib/db/models/Contradiction";
import "@/lib/db/models/MissingInfoFlag";
import "@/lib/db/models/GraphEdge";
import "@/lib/db/models/TimelineEvent";
import "@/lib/db/models/Deadline";
import "@/lib/db/models/Draft";
import "@/lib/db/models/ChatMessage";
