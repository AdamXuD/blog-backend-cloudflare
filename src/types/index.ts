export interface Env {
	USERNAME: string;
	PASSWORD: string;
	JWT_SECRET: string;
	BUCKET: R2Bucket;
	BASE_DIR: string;
}

export interface ArticleBrief {
	uuid: string;
	title: string;
	created_time: number;
}

export interface Article extends ArticleBrief {
	content: string;
	updated_time: number;
}

export interface Attachment {
	filename: string;
	article_uuid: string;
	size: number;
	uploaded_time: number;
}

export interface Site {
	title: string;
	description: string;
	github: string;
	email: string;
	footer: string;
}

export interface Metadata {
	site: Site;
	articles: ArticleBrief[];
}
