import { Router, error } from 'itty-router';

import { withAuth } from '../middleware';
import { isArticle, isSite } from '../utils';
import type { Env, Article, Metadata, Attachment } from '../types';

const jsonPutOption = {
	httpMetadata: {
		contentType: 'application/json',
	},
};

const pngPutOption = {
	httpMetadata: {
		contentType: 'image/png',
	},
};

export const adminApi = Router({ base: '/api/admin' });

adminApi.all('/*', withAuth);

adminApi.put('/avatar', async (request: Request, env: Env) => {
	const file = await request.arrayBuffer();
	if (file.byteLength === 0) {
		return error(400);
	}
	await env.BUCKET.put(`${env.BASE_DIR}/avatar.png`, file, pngPutOption);
	return new Response('Avatar uploaded', { status: 200 });
});

adminApi.put('/site', async (request: Request, env: Env) => {
	const content = await request.json();
	if (!isSite(content)) {
		return error(400);
	}
	const metadataJson = await env.BUCKET.get(`${env.BASE_DIR}/metadata`);
	if (!metadataJson) {
		return error(500, 'Internal Error: Metadata not found');
	}
	const metadata: Metadata = await metadataJson.json();
	await env.BUCKET.put(`${env.BASE_DIR}/metadata-bak`, JSON.stringify(metadata), jsonPutOption);
	await env.BUCKET.put(
		`${env.BASE_DIR}/metadata`,
		JSON.stringify({
			...metadata,
			site: content,
		}),
		jsonPutOption
	);
	return new Response('Site updated', { status: 200 });
});

adminApi.post('/article', async (request: Request, env: Env) => {
	const content: Article = await request.json();
	if (!isArticle(content)) {
		return error(400);
	}
	if (await env.BUCKET.head(`${env.BASE_DIR}/articles/${content.uuid}/current`)) {
		return error(409, 'Article already exists');
	}

	await env.BUCKET.put(
		`${env.BASE_DIR}/articles/${content.uuid}/current`,
		JSON.stringify(content),
		jsonPutOption
	);

	const metadataJson = await env.BUCKET.get(`${env.BASE_DIR}/metadata`);
	if (!metadataJson) {
		return error(500, 'Internal Error: Metadata not found');
	}
	const metadata: Metadata = await metadataJson.json();
	await env.BUCKET.put(`${env.BASE_DIR}/metadata-bak`, JSON.stringify(metadata), jsonPutOption);
	await env.BUCKET.put(
		`${env.BASE_DIR}/metadata`,
		JSON.stringify({
			...metadata,
			articles: [
				...metadata.articles,
				{
					uuid: content.uuid,
					title: content.title,
					created_time: content.created_time,
				},
			],
		}),
		jsonPutOption
	);

	return new Response('Article created', { status: 200 });
});

adminApi.put('/article', async (request: Request, env: Env) => {
	const content: Article = await request.json();
	if (!isArticle(content)) {
		return error(400);
	}
	const currentJson = await env.BUCKET.get(`${env.BASE_DIR}/articles/${content.uuid}/current`);
	if (!currentJson) {
		return error(404);
	}
	const currentText = await currentJson.text();
	await env.BUCKET.delete(`${env.BASE_DIR}/articles/${content.uuid}/stage`);
	await env.BUCKET.put(
		`${env.BASE_DIR}/articles/${content.uuid}/backup`,
		currentText,
		jsonPutOption
	);
	await env.BUCKET.put(
		`${env.BASE_DIR}/articles/${content.uuid}/current`,
		JSON.stringify(content),
		jsonPutOption
	);

	const metadataJson = await env.BUCKET.get(`${env.BASE_DIR}/metadata`);
	if (!metadataJson) {
		return error(500, 'Internal Error: Metadata not found');
	}
	const metadata: Metadata = await metadataJson.json();
	await env.BUCKET.put(`${env.BASE_DIR}/metadata-bak`, JSON.stringify(metadata), jsonPutOption);
	await env.BUCKET.put(
		`${env.BASE_DIR}/metadata`,
		JSON.stringify({
			...metadata,
			articles: metadata.articles.map(item => {
				if (item.uuid === content.uuid) {
					return {
						uuid: content.uuid,
						title: content.title,
						created_time: content.created_time,
					};
				}
				return item;
			}),
		}),
		jsonPutOption
	);

	return new Response('Article updated', { status: 200 });
});

adminApi.put('/article/stage', async (request: Request, env: Env) => {
	const content: Article = await request.json();
	if (!isArticle(content)) {
		return error(400);
	}
	if (!(await env.BUCKET.head(`${env.BASE_DIR}/articles/${content.uuid}/current`))) {
		return error(404);
	}
	await env.BUCKET.put(
		`${env.BASE_DIR}/articles/${content.uuid}/stage`,
		JSON.stringify(content),
		jsonPutOption
	);
	return new Response('Article staged', { status: 200 });
});

adminApi.delete('/article', async (request: Request, env: Env) => {
	const content: { uuid: string } = await request.json();
	if (!content || !content.uuid) {
		return error(400);
	}
	const currentJson = await env.BUCKET.get(`${env.BASE_DIR}/articles/${content.uuid}/current`);
	if (!currentJson) {
		return error(404);
	}
	await env.BUCKET.delete(`${env.BASE_DIR}/articles/${content.uuid}/stage`);
	await env.BUCKET.delete(`${env.BASE_DIR}/articles/${content.uuid}/backup`);
	await env.BUCKET.delete(`${env.BASE_DIR}/articles/${content.uuid}/current`);

	const metadataJson = await env.BUCKET.get(`${env.BASE_DIR}/metadata`);
	if (!metadataJson) {
		return error(500, 'Internal Error: Metadata not found');
	}
	const metadata: Metadata = await metadataJson.json();
	await env.BUCKET.put(`${env.BASE_DIR}/metadata-bak`, JSON.stringify(metadata), jsonPutOption);
	await env.BUCKET.put(
		`${env.BASE_DIR}/metadata`,
		JSON.stringify({
			...metadata,
			articles: metadata.articles.filter(item => item.uuid !== content.uuid),
		}),
		jsonPutOption
	);

	return new Response('Article deleted', { status: 200 });
});

adminApi.post('/attachment', async (request: Request, env: Env) => {
	const url = new URL(request.url);
	const filename = url.searchParams.get('filename');
	const uuid = url.searchParams.get('uuid') || '';
	const file = await request.arrayBuffer();
	if (file.byteLength <= 0 || !filename) {
		return error(400);
	}
	await env.BUCKET.put(`${env.BASE_DIR}/attachments/${filename}`, file);

	const info: Attachment = {
		filename,
		article_uuid: uuid,
		size: file.byteLength,
		uploaded_time: Date.now() / 1000,
	};
	const attachmentListJson = await env.BUCKET.get(`${env.BASE_DIR}/attachment-list`);
	if (!attachmentListJson) {
		return error(500, 'Internal Error: Attachment List Not Found.');
	}
	const attachmentList: Attachment[] = await attachmentListJson.json();
	await env.BUCKET.put(
		`${env.BASE_DIR}/attachment-list-bak`,
		JSON.stringify(attachmentList),
		jsonPutOption
	);
	await env.BUCKET.put(
		`${env.BASE_DIR}/attachment-list`,
		JSON.stringify([...attachmentList, info]),
		jsonPutOption
	);
	return new Response('Attachment uploaded', { status: 200 });
});

adminApi.delete('/attachment', async (request: Request, env: Env) => {
	const content: { filename: string } = await request.json();
	if (!content || !content.filename) {
		return error(400);
	}
	await env.BUCKET.delete(`${env.BASE_DIR}/attachments/${content.filename}`);

	const attachmentListJson = await env.BUCKET.get(`${env.BASE_DIR}/attachment-list`);
	if (!attachmentListJson) {
		return error(500, 'Internal Error: Attachment List Not Found.');
	}
	const attachmentList: Attachment[] = await attachmentListJson.json();
	await env.BUCKET.put(
		`${env.BASE_DIR}/attachment-list-bak`,
		JSON.stringify(attachmentList),
		jsonPutOption
	);
	await env.BUCKET.put(
		`${env.BASE_DIR}/attachment-list`,
		JSON.stringify(attachmentList.filter(item => item.filename !== content.filename)),
		jsonPutOption
	);
	return new Response('Attachment deleted', { status: 200 });
});

adminApi.put('/attachment', async (request: Request, env: Env) => {
	const content: { filename: string; article_uuid: string } = await request.json();
	if (!content || !content.filename || !content.article_uuid) {
		return error(400);
	}

	const attachmentListJson = await env.BUCKET.get(`${env.BASE_DIR}/attachment-list`);
	if (!attachmentListJson) {
		return error(500, 'Internal Error: Attachment List Not Found.');
	}
	const attachmentList: Attachment[] = await attachmentListJson.json();
	await env.BUCKET.put(
		`${env.BASE_DIR}/attachment-list-bak`,
		JSON.stringify(attachmentList),
		jsonPutOption
	);
	await env.BUCKET.put(
		`${env.BASE_DIR}/attachment-list`,
		JSON.stringify(
			attachmentList.map(item => {
				if (item.filename === content.filename) {
					return {
						...item,
						article_uuid: content.article_uuid,
					};
				}
				return item;
			})
		),
		jsonPutOption
	);
	return new Response('Attachment updated', { status: 200 });
});

adminApi.put('/init', async (request: Request, env: Env) => {
	await env.BUCKET.put(
		`${env.BASE_DIR}/metadata`,
		JSON.stringify({
			site: {
				title: 'My Blog',
				description: 'This is my blog.',
				github: '',
				email: '',
				footer: '',
			},
			articles: [],
		}),
		jsonPutOption
	);
	await env.BUCKET.put(`${env.BASE_DIR}/attachment-list`, JSON.stringify([]), jsonPutOption);
	return new Response('Initialized', { status: 200 });
});

adminApi.put('/recover', async (request: Request, env: Env) => {
	const metadataJsonBak = await env.BUCKET.get(`${env.BASE_DIR}/metadata-bak`);
	if (!metadataJsonBak) {
		return error(404, 'Metadata Not Found.');
	}
	const metadataBak: Metadata = await metadataJsonBak.json();
	await env.BUCKET.put(`${env.BASE_DIR}/metadata`, JSON.stringify(metadataBak), jsonPutOption);

	const attachmentListJsonBak = await env.BUCKET.get(`${env.BASE_DIR}/attachment-list-bak`);
	if (!attachmentListJsonBak) {
		return error(404, 'Attachment List Not Found');
	}
	const attachmentListBak: Attachment[] = await attachmentListJsonBak.json();
	await env.BUCKET.put(
		`${env.BASE_DIR}/attachment-list`,
		JSON.stringify(attachmentListBak),
		jsonPutOption
	);

	return new Response('Recovered', { status: 200 });
});
