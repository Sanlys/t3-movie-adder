import { createTRPCRouter } from "~/server/api/trpc";

import { exampleRouter } from "~/server/api/routers/example";
import { qBitTorrentRouter } from "~/server/api/routers/qBitTorrent";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  qBitTorrent: qBitTorrentRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
