#!/bin/bash
# Nginx配置快速修复脚本
# 解决重定向循环问题

echo "🔧 Nginx配置快速修复..."
echo ""

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用sudo运行此脚本"
    exit 1
fi

# 备份当前配置
CONFIG_FILE="/etc/nginx/sites-available/weather-app"
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "✅ 已备份配置到: $BACKUP_FILE"
else
    echo "⚠️  配置文件不存在: $CONFIG_FILE"
    echo "请先创建配置文件"
    exit 1
fi

# 创建certbot目录
echo "📁 创建certbot目录..."
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot
chmod -R 755 /var/www/certbot
echo "✅ certbot目录已创建"

# 检查配置中是否已有.well-known路径
if grep -q "\.well-known/acme-challenge" "$CONFIG_FILE"; then
    echo "✅ 配置中已包含.well-known路径"
else
    echo "⚠️  配置中缺少.well-known路径"
    echo "请在server块的最开始添加以下内容："
    echo ""
    echo "location /.well-known/acme-challenge/ {"
    echo "    root /var/www/certbot;"
    echo "    try_files \$uri =404;"
    echo "}"
    echo ""
    read -p "是否自动添加？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 在server块开始后添加
        sed -i '/server {/a\    location /.well-known/acme-challenge/ {\n        root /var/www/certbot;\n        try_files $uri =404;\n    }' "$CONFIG_FILE"
        echo "✅ 已自动添加.well-known路径"
    fi
fi

# 测试配置
echo ""
echo "🧪 测试Nginx配置..."
if nginx -t; then
    echo "✅ Nginx配置语法正确"
    read -p "是否重载Nginx配置？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        systemctl reload nginx
        echo "✅ Nginx已重载"
    fi
else
    echo "❌ Nginx配置有错误，请检查"
    exit 1
fi

echo ""
echo "🎉 修复完成！"
echo ""
echo "📝 下一步："
echo "1. 测试Let's Encrypt路径: curl http://your-domain.com/.well-known/acme-challenge/test"
echo "2. 查看错误日志: sudo tail -f /var/log/nginx/error.log"
echo "3. 详细说明请查看: NGINX_FIX.md"
