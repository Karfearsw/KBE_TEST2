import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../server/app";

// Catch-all handler to serve all /api/* routes via Express
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express app is compatible with Node Request/Response
  // @ts-expect-error Vercel types align with Node's
  return app(req, res);
}