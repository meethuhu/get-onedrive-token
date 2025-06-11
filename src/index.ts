/**
 * OneDrive Token 获取助手 - Cloudflare Workers 版本
 * 
 * 提供 OneDrive OAuth2 授权和 token 获取功能
 */

interface Env {
	// Define your environment variables here
}

// HTML页面内容
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OneDrive 令牌获取助手</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 20px auto; padding: 0 15px; background-color: #f8f9fa; color: #333; }
        .container { background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        h1, h2 { color: #007bff; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        label { font-weight: bold; margin-top: 1rem; display: block; }
        input, button, textarea { width: 100%; padding: 12px; margin: 8px 0; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; }
        button { background-color: #007bff; color: white; border-color: #007bff; cursor: pointer; font-weight: bold; }
        button:hover { background-color: #0056b3; }
        .info { background-color: #e9f7fe; border-left: 5px solid #007bff; padding: 15px; margin: 15px 0; }
        .success { background-color: #d4edda; border-left: 5px solid #28a745; padding: 15px; margin: 15px 0; }
        .error { background-color: #f8d7da; border-left: 5px solid #dc3545; padding: 15px; margin: 15px 0; }
        .code-inline { background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: "Courier New", Courier, monospace; word-break: break-all; overflow-wrap: break-word; }
        .tutorial { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .tutorial h3 { color: #495057; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .tutorial h3:first-child { margin-top: 0; }
        .tutorial ol { padding-left: 1.5rem; }        .tutorial li { margin-bottom: 0.5rem; }
        .warning { background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 15px 0; }
        
        /* 手机端适配 */
        @media (max-width: 768px) {
            body { margin: .5rem; padding: 0; }
            .container { padding: 1rem; }
			h1{ font-size: 1.8rem; }
			h2{ font-size: 1.5rem; }
        }
    </style>
</head>
<body>

    <div class="container">
        <h1>OneDrive 令牌获取助手</h1>
        <p>本工具会引导您完成手动获取 Refresh Token 的所有步骤，全程保障您的凭据安全。</p>
        
        <div class="tutorial">
            <h2>📋 应用注册教程</h2>
            <p>在使用本工具之前，您需要先在 Microsoft Entra ID 中注册一个应用。请按照以下步骤操作：</p>
            
            <h3>1. 登录 Microsoft Entra ID 管理中心</h3>
            <ol>
                <li>访问 <a href="https://entra.microsoft.com/" target="_blank">Microsoft Entra 管理中心</a></li>
                <li>使用你的 Microsoft 账户登录</li>
            </ol>
            
            <h3>2. 注册新应用</h3>
            <ol>
                <li>在左侧导航栏中，依次选择「标识 (Identity)」>「应用程序 (Applications)」>「应用注册 (App registrations)」</li>
                <li>点击「+ 新注册 (+ New registration)」</li>
            </ol>
            
            <h3>3. 填写应用信息</h3>
            <ol>
                <li><strong>名称 (Name)：</strong>给你的应用取一个容易识别的名字，例如 <code class="code-inline">MyOneDriveTool</code></li>
                <li><strong>支持的帐户类型 (Supported account types)：</strong>务必选择「任何组织目录(任何 Microsoft Entra ID 租户 - 多租户)中的帐户和个人 Microsoft 帐户(例如 Skype、Xbox)」</li>
                <li><strong>重定向 URI (Redirect URI)：</strong>
                    <ul>
                        <li>选择平台为「Web」</li>
                        <li>在 URL 输入框中填入 <code class="code-inline" id="callbackUrl"></code></li>
                    </ul>
                </li>
                <li>点击「注册 (Register)」</li>
            </ol>
            
            <h3>4. 获取 Client ID</h3>
            <p>注册成功后，页面会跳转到应用的概述页。在这里你可以找到并复制「应用程序(客户端) ID (Application (client) ID)」，这就是你的 <code class="code-inline">client_id</code>。请妥善保存。</p>
            
            <h3>5. 创建 Client Secret</h3>
            <ol>
                <li>在应用页面的左侧导航栏，选择「证书和密码 (Certificates & secrets)」</li>
                <li>点击「+ 新客户端密码 (+ New client secret)」</li>
                <li><strong>说明 (Description)：</strong>随意填写，例如 <code class="code-inline">mysecret</code></li>
                <li><strong>过期 (Expires)：</strong>选择最长的时间，例如「24 个月 (24 months)」</li>
                <li>点击「添加 (Add)」</li>
            </ol>
            
            <div class="warning">
                <strong>⚠️ 重要提醒：</strong> <br>此时页面会生成一个客户端密码，它的「值 (Value)」只会显示这一次。请立即复制并保存好，这就是你的 <code class="code-inline">client_secret</code>。关闭页面后将无法再次查看！
            </div>
        </div>
        
        <h2>🚀 开始获取令牌</h2>
        <p>完成应用注册后，请在下方输入您获得的 Client ID 和 Client Secret：</p>
        
        <label for="clientId">Client ID:</label>
        <input type="text" id="clientId" placeholder="在此处粘贴您的 Client ID">
        
        <label for="clientSecret">Client Secret:</label>
        <input type="text" id="clientSecret" placeholder="在此处粘贴您的 Client Secret">
        
        <div class="info">
            <strong>⚠️ 重要提醒：</strong><br/>
            在 Azure 应用注册时，请确保添加重定向 URI：<code class="code-inline" id="callbackUrlInfo"></code><br/>
            此 URI 必须与您在应用注册中配置的重定向 URI 完全一致，否则授权将失败。
        </div>
        
        <button onclick="startAuth()">开始授权</button>
    </div>

    <script>
        // 设置回调地址
        function setCallbackUrl() {
            const baseUrl = window.location.origin;
            const callbackUrl = baseUrl + '/onedrive/callback';
            document.getElementById('callbackUrl').textContent = callbackUrl;
            document.getElementById('callbackUrlInfo').textContent = callbackUrl;
        }

        function startAuth() {
            const clientId = document.getElementById('clientId').value.trim();
            const clientSecret = document.getElementById('clientSecret').value.trim();

            if (!clientId || !clientSecret) {
                showValidationError("请输入 Client ID 和 Client Secret！");
                return;
            }

            // 保存到 localStorage
            localStorage.setItem('onedrive_client_id', clientId);
            localStorage.setItem('onedrive_client_secret', clientSecret);

            const baseUrl = window.location.origin;
            const redirectUri = baseUrl + '/onedrive/callback';
            
            // 构建授权 URL
            const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
            authUrl.searchParams.append('client_id', clientId);
            authUrl.searchParams.append('scope', 'files.readwrite.all offline_access');
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('redirect_uri', redirectUri);

            // 跳转到授权页面
            window.location.href = authUrl.toString();
        }

        function showValidationError(message) {
            // 创建临时错误提示元素
            const feedback = document.createElement('div');
            feedback.textContent = '⚠️ ' + message;            feedback.style.cssText = \`
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(-100%);
                background-color: #dc3545;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transition: all 0.4s ease;
                white-space: nowrap;
            \`;
            
            document.body.appendChild(feedback);
              // 触发动画
            setTimeout(() => {
                feedback.style.opacity = '1';
                feedback.style.transform = 'translateX(-50%) translateY(0)';
            }, 10);
            
            // 3秒后移除
            setTimeout(() => {
                feedback.style.opacity = '0';
                feedback.style.transform = 'translateX(-50%) translateY(-100%)';
                setTimeout(() => {
                    document.body.removeChild(feedback);
                }, 400);
            }, 3000);
        }

        // 页面加载时执行
        window.onload = function() {
            setCallbackUrl();
        };
    </script>

</body>
</html>`;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// 处理根路径，返回HTML页面
		if (path === '/') {
			return new Response(HTML_CONTENT, {
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
	return new Response(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>完成授权</title>
			<meta charset="UTF-8">
			<style>
				body { 
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
					line-height: 1.6; 
					max-width: 800px; 
					margin: 20px auto; 
					padding: 0 15px; 
					background-color: #f8f9fa; 
					color: #333; 
				}
				.container { 
					background-color: #fff; 
					padding: 25px; 
					border-radius: 8px; 
					box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
				}
				h1, h2 { 
					color: #007bff; 
					border-bottom: 2px solid #eee; 
					padding-bottom: 10px; 
				}
				label { 
					font-weight: bold; 
					margin-top: 1rem; 
					display: block; 
				}				input, button { 
					width: 100%; 
					padding: 12px; 
					margin: 8px 0; 
					box-sizing: border-box; 
					border: 1px solid #ccc; 
					border-radius: 4px; 
					font-size: 16px; 
				}
				input:read-only { 
					background-color: #f8f9fa; 
					border-color: #dee2e6; 
					color: #6c757d; 
					cursor: not-allowed; 
				}
				button { 
					background-color: #007bff; 
					color: white; 
					border-color: #007bff; 
					cursor: pointer; 
					font-weight: bold; 
				}
				button:hover { 
					background-color: #0056b3; 
				}
				button:disabled {
					background-color: #a8a9ab;
					border-color: #a8a9ab;
					cursor: not-allowed;
				}
				.info { 
					background-color: #e9f7fe; 
					border-left: 5px solid #007bff; 
					padding: 15px; 
					margin: 15px 0; 
				}
				.success { 
					background-color: #d4edda; 
					border-left: 5px solid #28a745; 
					padding: 15px; 
					margin: 15px 0; 
				}
				.error { 
					background-color: #f8d7da; 
					border-left: 5px solid #dc3545; 
					padding: 15px; 
					margin: 15px 0; 
				}
				.loading { 
					text-align: center; 
					margin: 20px 0; 
					color: #007bff;
				}
				.loading::after {
					content: '';
					display: inline-block;
					width: 20px;
					height: 20px;
					margin-left: 10px;
					border: 2px solid #007bff;
					border-radius: 50%;
					border-top-color: transparent;
					animation: spin 1s ease-in-out infinite;
				}
				@keyframes spin {
					to { transform: rotate(360deg); }
				}
						.token-container {
					margin: 10px 0;
				}
				
				.token-display {
					background-color: #e9ecef; 
					border: 1px solid #dee2e6; 
					border-radius: 5px; 
					padding: 10px; 
					word-break: break-all; 
					font-family: "Courier New", Courier, monospace; 
					font-size: 14px;
					max-height: 120px;
					overflow-y: auto;
					scrollbar-width: none;
					-ms-overflow-style: none;
					cursor: pointer;
					transition: all 0.3s ease;
					position: relative;
				}
				
				.token-display::-webkit-scrollbar {
					display: none;
				}
				
				.token-display:hover {
					background-color: #dee2e6;
					border-color: #007bff;
				}
				
				.token-display.refresh-token {
					max-height: 200px;
				}
				
				.token-display.copied {
					background-color: #d4edda;
					border-color: #28a745;
					transform: scale(1.01);
				}				.copy-feedback {
					position: fixed;
					top: 20px;
					left: 50%;
					transform: translateX(-50%) translateY(-100%);
					background-color: #28a745;
					color: white;
					padding: 12px 20px;
					border-radius: 6px;
					box-shadow: 0 4px 12px rgba(0,0,0,0.2);
					opacity: 0;
					transition: all 0.4s ease;
					z-index: 1000;
					font-size: 14px;
					font-weight: 500;
					white-space: nowrap;
				}
				.copy-feedback.show {
					opacity: 1;
					transform: translateX(-50%) translateY(0);
				}
				.button-group {
					display: flex;
					gap: 10px;
					margin-top: 20px;
				}
				.button-group button {
					flex: 1;
				}				.credentials-section {
					margin-top: 20px;
					border-top: 2px solid #eee;
					padding-top: 20px;
				}
				
				/* 手机端适配 */
				@media (max-width: 768px) {
					body { margin: 0; padding: 0; }
					.container { padding: 1rem; }
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h1>🎉 授权成功！</h1>
						<div id="inputSection">
					<div class="info">
						已收到授权码，请确认您的 Client ID 和 Client Secret：
					</div>
					
					<label for="clientId">Client ID:</label>
					<div class="token-container">
						<div class="token-display" id="inputClientId">
							<span id="inputClientIdText">正在从存储中读取...</span>
						</div>
					</div>
					
					<label for="clientSecret">Client Secret:</label>
					<div class="token-container">
						<div class="token-display" id="inputClientSecret">
							<span id="inputClientSecretText">正在从存储中读取...</span>
						</div>
					</div>
				</div>
				
				<div id="loading" class="loading" style="display: none;">
					正在获取 Access Token 和 Refresh Token
				</div>
				
				<div id="error" class="error" style="display: none;"></div>
				
				<div id="result" style="display: none;">
					<div class="success">
						✅ <strong>获取成功！</strong> 恭喜您已成功获取到 OneDrive 的所有凭据信息。
					</div>
					
					<div class="credentials-section">
						<h2>📋 完整凭据信息</h2>
								<label>Client ID:</label>
						<div class="token-container">
							<div class="token-display" id="displayClientId" onclick="copyText('clientIdText')">
								<span id="clientIdText"></span>
							</div>
						</div>
						
						<label>Client Secret:</label>
						<div class="token-container">
							<div class="token-display" id="displayClientSecret" onclick="copyText('clientSecretText')">
								<span id="clientSecretText"></span>
							</div>
						</div>
						
						<label>回调地址 (Redirect URI):</label>
						<div class="token-container">
							<div class="token-display" id="displayRedirectUri" onclick="copyText('redirectUriText')">
								<span id="redirectUriText"></span>
							</div>
						</div>
						
						<label>Access Token:</label>
						<div class="token-container">
							<div class="token-display" id="displayAccessToken" onclick="copyText('accessTokenText')">
								<span id="accessTokenText"></span>
							</div>
						</div>
						
						<label>Refresh Token:</label>
						<div class="token-container">
							<div class="token-display refresh-token" id="displayRefreshToken" onclick="copyText('refreshTokenText')">
								<span id="refreshTokenText"></span>
							</div>
						</div>
					</div>
					
					<div class="button-group">
						<button onclick="copyAllCredentials()">复制所有凭据</button>
						<button onclick="goHome()">返回首页</button>
					</div>
					
					<div class="info">
						<strong>✅ 完成！</strong>您现在已经集齐了挂载OneDrive所需的全部信息。<br/>
						• <strong>Client ID</strong> 和 <strong>Client Secret</strong> 用于应用身份认证<br/>
						• <strong>Access Token</strong> 用于短期API访问（有效期约1小时）<br/>
						• <strong>Refresh Token</strong> 用于长期访问（可用于刷新Access Token）
					</div>
				</div>
			</div>

			<!-- 复制成功提示 -->
			<div class="copy-feedback" id="copyFeedback">✅ 已复制到剪贴板</div>

			<script>
				const authCode = '${code}';
				let credentials = {};
						// 页面加载时自动尝试获取token
				window.onload = function() {
					const clientId = localStorage.getItem('onedrive_client_id');
					const clientSecret = localStorage.getItem('onedrive_client_secret');
					
					if (clientId) {
						document.getElementById('inputClientIdText').textContent = clientId;
					} else {
						document.getElementById('inputClientIdText').textContent = '未找到存储的 Client ID';
					}
					
					if (clientSecret) {
						document.getElementById('inputClientSecretText').textContent = clientSecret;
					} else {
						document.getElementById('inputClientSecretText').textContent = '未找到存储的 Client Secret';
					}
					
					// 如果都有值，自动执行
					if (clientId && clientSecret) {
						// 延迟执行，给用户时间看到凭据信息
						setTimeout(exchangeToken, 1000);
					}
				};				async function exchangeToken() {
					const clientId = localStorage.getItem('onedrive_client_id');
					const clientSecret = localStorage.getItem('onedrive_client_secret');

					if (!clientId || !clientSecret) {
						document.getElementById('error').style.display = 'block';
						document.getElementById('error').textContent = '错误: 未找到存储的 Client ID 或 Client Secret';
						return;
					}

					document.getElementById('loading').style.display = 'block';
					document.getElementById('error').style.display = 'none';

					try {
						const response = await fetch('/api/token', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								clientId,
								clientSecret,
								code: authCode,
								redirectUri: window.location.origin + '/onedrive/callback'
							})
						});

						const result = await response.json();
						
						if (result.success) {
							credentials = {
								clientId: clientId,
								clientSecret: clientSecret,
								redirectUri: window.location.origin + '/onedrive/callback',
								accessToken: result.access_token,
								refreshToken: result.refresh_token
							};
							
							// 显示所有凭据
							document.getElementById('clientIdText').textContent = credentials.clientId;
							document.getElementById('clientSecretText').textContent = credentials.clientSecret;
							document.getElementById('redirectUriText').textContent = credentials.redirectUri;
							document.getElementById('accessTokenText').textContent = credentials.accessToken;
							document.getElementById('refreshTokenText').textContent = credentials.refreshToken;
							
							document.getElementById('result').style.display = 'block';
							document.getElementById('loading').style.display = 'none';
							document.getElementById('inputSection').style.display = 'none';
						} else {
							throw new Error(result.error || '获取 token 失败');
						}					} catch (error) {
						document.getElementById('loading').style.display = 'none';
						document.getElementById('error').style.display = 'block';
						document.getElementById('error').textContent = '错误: ' + error.message;
					}
				}				function copyText(spanId) {
					const textElement = document.getElementById(spanId);
					const text = textElement.textContent;
					const container = textElement.parentElement;
					
					copyToClipboard(text).then(() => {
						showCopyFeedback();
						updateContainerState(container);
					});
				}

				function copyAllCredentials() {
					const allText = \`OneDrive 凭据信息：

Client ID: \${credentials.clientId}

Client Secret: \${credentials.clientSecret}

回调地址 (Redirect URI): \${credentials.redirectUri}

Access Token: \${credentials.accessToken}

Refresh Token: \${credentials.refreshToken}\`;
					
					copyToClipboard(allText).then(() => {
						showCopyFeedback('✅ 所有凭据已复制到剪贴板');
					});
				}

				// 统一的复制到剪贴板函数
				function copyToClipboard(text) {
					return navigator.clipboard.writeText(text).catch(() => {
						// 降级方案
						const textArea = document.createElement('textarea');
						textArea.value = text;
						document.body.appendChild(textArea);
						textArea.select();
						document.execCommand('copy');
						document.body.removeChild(textArea);
						return Promise.resolve();
					});
				}				// 统一的容器状态更新函数
				function updateContainerState(container) {
					container.classList.add('copied');
					
					setTimeout(() => {
						container.classList.remove('copied');
					}, 1000);
				}

				function showCopyFeedback(message = '✅ 已复制到剪贴板') {
					const feedback = document.getElementById('copyFeedback');
					feedback.textContent = message;
					feedback.classList.add('show');
					
					setTimeout(() => {
						feedback.classList.remove('show');
					}, 3000);
				}

				function goHome() {
					window.location.href = '/?refresh_token=' + encodeURIComponent(credentials.refreshToken);
				}
			</script>
		</body>
		</html>
	`, {
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
