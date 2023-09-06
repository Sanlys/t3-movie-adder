import { z, ZodError } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure
} from "~/server/api/trpc";

import { env } from "~/env.mjs";

const USERNAME = env.QBITTORRENT_USERNAME
const PASSWORD = env.QBITTORRENT_PASSWORD
const SERVER_NAME = env.QBITTORRENT_SERVER_NAME

async function auth(): Promise<string | null> {
    const url = `http://${SERVER_NAME}/api/v2/auth/login`;
    
    const formData = new URLSearchParams();
    formData.append('username', USERNAME);
    formData.append('password', PASSWORD);

    const response = await fetch(url, { method: 'POST', body: formData});

    if (response.status !== 200) {
	    return null
    }

    const setCookieHeader = response.headers.get('Set-Cookie')
    const sidMatch = setCookieHeader?.match(/SID=([^;]+)/);
    return sidMatch ? sidMatch?.[1] ?? null : null;
}

async function addTorrent(SID: string, magnet: string, username: string): Promise<boolean> {
    const url = `http://${SERVER_NAME}/api/v2/torrents/add`;
    const savePath = `/downloads/movies/${username}`;

    const formData = new FormData();
    formData.append('urls', magnet);
    formData.append('savepath', savePath);

    const response = await fetch(url, {
    	method: 'POST',
        headers: { 'Cookie': `SID=${SID}`},
        body: formData
    });

    if (response.status !== 200) {
	    return false
    }
    else return true
}

export const qBitTorrentRouter = createTRPCRouter({
    add: protectedProcedure
        .input(z.object({ magnet: z.string() }))
        .mutation(async ({ input, ctx }) => {
            try {
                const SID = await auth();
                if (!SID) {
                    throw new Error('Authentication failed');
                }
                await addTorrent(SID, input.magnet, ctx.session.user.email as string);
                return;
            } catch (error) {
                throw new Error("Boo fucking hoo bitch")
            }
        }),
    info: protectedProcedure
        .query(async ({ }) => {
	    const url = `http://${SERVER_NAME}/api/v2/torrents/info`;

	    const SID = await auth();
	    if (!SID) {
		    throw new Error('Authentication failed loser');
	    }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cookie': `SID=${SID}`
                }
            });

            if (!response.ok) {
                throw new Error("Actual skill issue")
            }

            const data = await response.json();
            return data;
	})
});
