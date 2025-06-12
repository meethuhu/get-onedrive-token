# OneDrive 令牌获取助手

一个运行在 Cloudflare Workers 上的 OneDrive API 令牌获取工具，包括 Access Token 和 Refresh Token。

基于 [alist-onedrive-token](https://github.com/RedwindA/alist-onedrive-token) 修改，添加了自动获取Token的步骤，无需手动发送请求。

---

### 一键部署：<br>
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/meethuhu/get-onedrive-token)

### 手动部署：<br>
复制 `/src/index.ts` 内容到 cloudflare workers
