# blog-backend-cloudflare

这是自用博客的后端部分，包含完善的带鉴权的文章管理与附件管理功能。

该后端适用于Cloudflare Worker ，整套系统满足 Serverless 思想。

若需要部署到本地，请参考[itty-router](https://itty.dev/itty-router/runtimes#Node)自行做修改，并自行修改对象存储为本地数据库。



## 推荐 IDE 配置

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).



## 使用方法

### 开发部署

1. 若将项目中的`wrangler.toml.example`文件复制一份命名为`wrangler.toml`，并修改vars标签下的全局变量（关于全局变量下方会进行说明）。

2. 在控制台中执行`npm i`。

3. 在控制台中执行`npm run dev`即可在本地运行一个热重载开发服务器。

### Cloudflare Worker部署

1. 登录到`Cloudflare`，在`Cloudflare`中打开找到`Worker & Pages`界面。

2. 若是`Cloudflare Worker`新用户的话直接选择使用免费套餐并绑定支付方式即可。

3. 在Cloudflare R2界面创建存储桶，并在存储桶的`Settings`页面中`Public access`绑定自己的域名（该步骤与前端`VITE_BLOG_PUBLIC_PREFIX`的取值有关），并将CORS policy修改为以下值。
   
   ```json
   [
     {
       "AllowedOrigins": [
         "*"
       ],
       "AllowedMethods": [
         "GET",
         "DELETE",
         "HEAD",
         "POST",
         "PUT"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "ExposeHeaders": [
         "*"
       ]
     }
   ]
   ```

4. 将仓库clone到本地，并将`wrangler.toml.example`文件复制一份命名为`wrangler.toml`，修改`route`中的`pattern`为自己的域名（该步骤与前端`VITE_BLOG_API_PREFIX`的取值有关），并修改[[r2_buckets]]标签下的bucket_name为自己的桶名称，修改[vars]标签中的全局变量（关于全局变量的解释在下文中会进行说明）。
5. 最后在控制台中输入`npm run deploy`进行部署。



## 关于全局变量的解释

| 属性名称       | 类型  | 含义                                                 |
| ---------- | --- | -------------------------------------------------- |
| USERNAME   | str | 前端登录需要的用户名                                         |
| PASSWORD   | str | 前端登录需要的密码明文                                        |
| JWT_SECRET | str | JWT生成所需的加密盐（可为任意字符串）                               |
| BASE_DIR   | str | 后端在桶中使用的目录名称（该步骤与前端`VITE_BLOG_PUBLIC_PREFIX`的取值有关） |



## 关于前端环境变量中的链接前缀

```
VITE_BLOG_PUBLIC_PREFIX=
https://{创建桶Public access中绑定的域名}/{后端全局变量的BASE_DIR}/

VITE_BLOG_API_PREFIX=
https://{wrangler.toml文件中route设定的pattern}/
```
