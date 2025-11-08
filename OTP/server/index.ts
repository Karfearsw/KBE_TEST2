import { app, attachFrontend } from "./app";
import { log } from "./vite";

(async () => {
  await attachFrontend();

  // Local/dev server binding only; Vercel uses serverless handler
  const port = 5000;
  const server = await (await import("http")).createServer(app);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
