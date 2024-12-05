# snow-antdv-admin


## 启动项目

```bash
# 克隆项目
cd snow-antdv-admin

# 安装依赖 可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npmmirror.com

# 启动服务
npm run dev
```

## 检查更新

```bash
# 安装npm-check-updates
npm install -g npm-check-updates

# 检查更新
ncu --registry=https://registry.npmmirror.com

# 更新package.json中的包版本号
ncu -u --registry=https://registry.npmmirror.com

# 安装更新后的包
npm install --registry=https://registry.npmmirror.com
```
