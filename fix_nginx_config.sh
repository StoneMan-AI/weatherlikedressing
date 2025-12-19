#!/bin/bash
# Nginx配置紧急修复脚本
# 解决路径错误、重定向循环、500错误等问题

set -e

echo "🚨 Nginx配置紧急修复开始..."
echo ""

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用sudo运行此脚本"
    exit 1
fi

# 配置变量
APP_DIR="/var/www/weatherlikedressing"
CONFIG_FILE="/etc/nginx/sites-available/weatherlikedressing"
ENABLED_FILE="/etc/nginx/sites-enabled/weatherlikedressing"

# 备份当前配置
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "✅ 已备份配置到: $BACKUP_FILE"
fi

# 创建应用目录（如果不存在）
echo "📁 检查应用目录..."
if [ ! -d "$APP_DIR/frontend/dist" ]; then
    echo "⚠️  前端dist目录不存在，正在创建..."
    mkdir -p "$APP_DIR/frontend/dist"
    chown -R www-data:www-data "$APP_DIR"
    echo "✅ 目录已创建"
else
    echo "✅ 前端目录存在: $APP_DIR/frontend/dist"
fi

# 创建certbot目录
echo "📁 检查certbot目录..."
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot
chmod -R 755 /var/www/certbot
echo "✅ certbot目录已准备"

# 创建正确的Nginx配置
echo "📝 创建Nginx配置文件..."

cat > "$CONFIG_FILE" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name adddesigngroup.com www.adddesigngroup.com;

    # ⚠️ 最高优先级：Let's Encrypt验证路径（必须在最前面！）
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
        access_log off;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 健康检查端点
    location /health {
        proxy_pass http://localhost:3300/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # 静态资源 - 带缓存（必须在location /之前）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        root /var/www/weatherlikedressing/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # favicon.ico 特殊处理
    location = /favicon.ico {
        root /var/www/weatherlikedressing/frontend/dist;
        access_log off;
        log_not_found off;
        expires 1y;
        try_files $uri /favicon.ico =204;
    }

    # 前端应用 - SPA路由处理（放在最后）
    location / {
        root /var/www/weatherlikedressing/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # index.html不缓存
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    # 日志配置
    access_log /var/log/nginx/weatherlikedressing-access.log;
    error_log /var/log/nginx/weatherlikedressing-error.log;
}
EOF

echo "✅ 配置文件已创建"

# 启用配置
if [ ! -L "$ENABLED_FILE" ]; then
    ln -s "$CONFIG_FILE" "$ENABLED_FILE"
    echo "✅ 配置已启用"
fi

# 测试配置
echo ""
echo "🧪 测试Nginx配置..."
if nginx -t; then
    echo "✅ Nginx配置语法正确"
    
    # 重载配置
    echo ""
    read -p "是否立即重载Nginx配置？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        systemctl reload nginx
        echo "✅ Nginx已重载"
        
        # 检查Nginx状态
        if systemctl is-active --quiet nginx; then
            echo "✅ Nginx运行正常"
        else
            echo "❌ Nginx未运行，尝试启动..."
            systemctl start nginx
        fi
    fi
else
    echo "❌ Nginx配置有错误，请检查"
    exit 1
fi

echo ""
echo "🎉 修复完成！"
echo ""
echo "📝 验证步骤："
echo "1. 测试Let's Encrypt路径: curl -I http://adddesigngroup.com/.well-known/acme-challenge/test"
echo "2. 测试首页: curl -I http://adddesigngroup.com/"
echo "3. 查看错误日志: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "📋 重要提醒："
echo "- 确保前端已构建: cd $APP_DIR/frontend && npm run build"
echo "- 确保后端服务运行在3300端口"
echo "- 如有SSL证书，请添加HTTPS server块配置"
