#!/bin/sh
set -e

# 初始化数据库
echo "Running database setup..."
npx prisma db push --skip-generate
node prisma/seed.js

# 启动应用
echo "Starting server..."
exec node server.js
