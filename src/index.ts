/**
 * OneDrive Token 获取助手 - Cloudflare Workers 版本
 * 
 * 提供 OneDrive OAuth2 授权和 token 获取功能
 */

// 引入 HTML 内容
import indexHtml from './index.html';
import callbackHtml from './callback.html';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// 处理根路径，返回HTML页面
		if (path === '/') {
			return new Response(indexHtml, { // 修改为使用导入的 HTML
				headers: {
					'Content-Type': 'text/html; charset=utf-8',
				},
			});
		}

		// 处理OneDrive回调
		if (path === '/onedrive/callback') {
			return handleCallback(request);
		}

		// 处理token交换API
		if (path === '/api/token' && request.method === 'POST') {
			return handleTokenExchange(request);
		}

		// 404
		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

// 处理OneDrive OAuth回调
async function handleCallback(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		return new Response(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>授权失败</title>
				<meta charset="UTF-8">
			</head>
			<body>
				<h1>授权失败</h1>
				<p>错误信息: ${error}</p>
				<p>错误描述: ${url.searchParams.get('error_description') || '未知错误'}</p>
				<a href="/">返回首页</a>
			</body>
			</html>
		`, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
			status: 400,
		});
	}

	if (!code) {
		return new Response(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>授权失败</title>
				<meta charset="UTF-8">
			</head>
			<body>
				<h1>授权失败</h1>
				<p>未收到授权码</p>
				<a href="/">返回首页</a>
			</body>
			</html>
		`, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
			status: 400,
		});
	}

	// 返回一个中间页面，让用户输入client_id和client_secret，然后自动获取token
	// 将授权码注入到 callback HTML 中
	const populatedCallbackHtml = callbackHtml.replace('{{CODE}}', code);
	return new Response(populatedCallbackHtml, { // 修改为使用导入和处理后的 HTML
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}

// 处理token交换
async function handleTokenExchange(request: Request): Promise<Response> {
	try {
		const body = await request.json() as {
			clientId: string;
			clientSecret: string;
			code: string;
			redirectUri: string;
		};

		const { clientId, clientSecret, code, redirectUri } = body;

		if (!clientId || !clientSecret || !code || !redirectUri) {
			return Response.json({
				success: false,
				error: '缺少必要参数'
			}, { status: 400 });
		}

		// 向Microsoft请求token
		const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				grant_type: 'authorization_code',
				code: code,
			}),
		});

		const tokenData = await tokenResponse.json() as any;

		if (!tokenResponse.ok) {
			return Response.json({
				success: false,
				error: tokenData.error_description || tokenData.error || '获取token失败'
			}, { status: 400 });
		}

		return Response.json({
			success: true,
			access_token: tokenData.access_token,
			refresh_token: tokenData.refresh_token,
			expires_in: tokenData.expires_in,
		});

	} catch (error) {
		return Response.json({
			success: false,
			error: '服务器内部错误: ' + (error as Error).message
		}, { status: 500 });
	}
}
