import { Router, error, json } from 'itty-router';

import type { Env } from '../types';
import { generateJWT } from '../utils';

export const publicApi = Router({ base: '/api/public' });

publicApi.get('/file', async (request: Request, env: Env) => {
	const path = new URL(request.url).searchParams.get('path');
	if (!path) return error(400);
	const file = await env.BUCKET.get(`${env.BASE_DIR}/${path}`);
	if (!file) return error(404);
	return new Response(await file.arrayBuffer(), {
		status: 200,
		headers: {
			'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
			'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
		},
	});
});

publicApi.post('/login', async (request: Request, env: Env) => {
	const auth: {
		username: string;
		password: string;
	} = await request.json();
	if (auth.username !== env.USERNAME || auth.password !== env.PASSWORD) {
		return error(401);
	}
	return json({ token: await generateJWT(auth.username, env.JWT_SECRET) });
});
