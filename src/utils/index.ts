import type { Article, ArticleBrief, Attachment, Site, Metadata, Env } from '../types';
import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

export function isArticle(x: unknown): x is Article {
	if ((x as Article).constructor !== Object) return false;
	if (Object.keys(x as Article).length !== 5) return false;
	if (typeof (x as Article).uuid !== 'string' && (x as Article).uuid.length === 0) return false;
	if (typeof (x as Article).title !== 'string' && (x as Article).title.length === 0) return false;
	if (typeof (x as Article).created_time !== 'number') return false;
	if (typeof (x as Article).content !== 'string') return false;
	if (typeof (x as Article).updated_time !== 'number') return false;
	return true;
}

export function isSite(x: unknown): x is Site {
	if ((x as Site).constructor !== Object) return false;
	if (Object.keys(x as Article).length !== 5) return false;
	if (typeof (x as Site).title !== 'string' && (x as Site).title.length === 0) return false;
	if (typeof (x as Site).description !== 'string') return false;
	if (typeof (x as Site).github !== 'string') return false;
	if (typeof (x as Site).email !== 'string') return false;
	if (typeof (x as Site).footer !== 'string') return false;
	return true;
}

export function generateJWT(username: string, secret: string): Promise<string> {
	return sign({ username, exp: Date.now() / 1000 + 24 * 60 * 60 }, secret);
}

export function verifyJWT(token: string, secret: string): Promise<boolean> {
	return verify(token, secret);
}
