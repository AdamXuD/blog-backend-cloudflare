import type { Env } from './types';
import { handler } from './api';

export default {
	fetch: (request: Request, env: Env) => handler(request, env),
};
