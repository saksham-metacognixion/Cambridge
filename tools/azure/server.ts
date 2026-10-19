/*
 * Node entry for Azure: `node dist-server/server.mjs` (bundled by tools/azure/bundle.mjs). Serves the Astro build in
 * dist/ next to it through tools/azure/handler.ts. PORT / HOST and the env vars of .env.example come from App Service
 * application settings (deploy/azure/README.md) or the VM's systemd unit and env file (deploy/vm/README.md).
 */
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHandler } from "./handler";
import { sendResponse, toRequest } from "./node-adapter";
import type { Env } from "../../functions/_lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const handle = createHandler(root, process.env as unknown as Env);

const server = createServer(async (req, res) => {
  try {
    await sendResponse(req, res, await handle(toRequest(req)));
  } catch (e) {
    // A visitor closing the connection mid-response lands here too. Never log request contents (form fields).
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
    } else res.destroy();
    if ((e as NodeJS.ErrnoException)?.code !== "ERR_STREAM_PREMATURE_CLOSE")
      console.error(`request failed: ${e instanceof Error ? e.message : "unknown"}`);
  }
});

const port = Number(process.env.PORT) || 8080;
// HOST unset = every interface (App Service). Behind a local reverse proxy (the VM, deploy/vm/) it is 127.0.0.1.
const host = process.env.HOST || undefined;
server.listen(port, host, () => console.log(`serving ${root} on ${host ?? "*"}:${port}`));
// App Service stops the container with SIGTERM: finish the requests in flight, then exit.
process.on("SIGTERM", () => server.close(() => process.exit(0)));
