import { Router, createCors, error, json } from 'itty-router';
import { publicApi } from './public';
import { adminApi } from './admin';

const routes = Router({ base: '/api' });

const { preflight, corsify } = createCors({
	methods: ['*'],
	origins: ['*'],
});

routes.all('*', preflight);
routes.all('/public/*', publicApi.handle);
routes.all('/admin/*', adminApi.handle);
routes.all('*', () => error(404, 'Route Not Found'));

export const handler = (request: Request, ...extras: any[]) => {
	return routes
		.handle(request, ...extras)
		.then(json)
		.catch(error)
		.then(corsify);
};
