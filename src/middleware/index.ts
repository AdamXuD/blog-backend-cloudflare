import { Env } from '../types';
import { verifyJWT } from '../utils';

export const withAuth = (request: Request, env: Env) => {
	const { headers } = request;
	const auth = headers.get('Authorization');
	if (!auth) throw new Error('Unauthorized');
	const [type, token] = auth.split(' ');
	if (type !== 'Bearer') throw new Error('Unauthorized');
	if (!verifyJWT(token, env.JWT_SECRET)) throw new Error('Unauthorized');
};
