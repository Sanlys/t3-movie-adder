import { z, ZodError } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
    createError
} from "~/server/api/trpc";

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const SERVER_NAME = process.env.SERVER_NAME || 'direct.lysakermoen.com:8082';

async function auth(username, password): Promise<string | null> {
    const url = `http://${SERVER_NAME}:8082/api/v2/auth/login`;
    
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', PASSWORD);

    const response = await fetch(url, { method: 'POST', body: formData});

    if (response.status !== 200) {
	return null
    }

    const setCookieHeader = response.headers.get('Set-Cookie');
    const sidMatch = setCookieHeader?.match(/SID=([^;]+)/);
    return sidMatch ? sidMatch[1] : null;
}

async function addTorrent(SID: string, magnet: string, username: string): Promise<void> {
    const url = `http://${SERVER_NAME}/api/v2/torrents/add`;
    const savePath = `/downloads/movies/${username}`;

    const formData = new FormData();
    formData.append('urls', magnet);
    formData.append('savepath', savepath);

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
        .query(async ({ input, ctx }) => {
            try {
                const SID = await auth();
                if (!SID) {
                    throw new Error('Authentication failed');
                }
                await addTorrent(SID, input.magnet, ctx.user?.username);
                return;
            } catch (error) {
                throw createError({
                    code: 'ZOD_ERROR',
                    message: error.message,
                    status: 400,
                    originalError: new ZodError([{
                        message: error.message,
                        path: [],
                        code: z.ZodIssueCode.custom,
                        params: { custom: error.message }
                    }])
                });
            }
        }),
    info: protectedProcedure
        .query(async ({ }) => {
	    const url = `https://${SERVER_NAME}/api/v2/torrents/info`;

	    const SID = await auth();
	    if (!SID) {
		throw new Error('Authentication failed');
	    }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cookie': `SID=${SID}`
                }
            });

            if (!response.ok) {
                throw createError({
                    code: 'FETCH_ERROR',
                    message: `Failed to fetch info. Status: ${response.status}`,
                    status: response.status
                });
            }

            const data = await response.json();
            return data;
	})
});
