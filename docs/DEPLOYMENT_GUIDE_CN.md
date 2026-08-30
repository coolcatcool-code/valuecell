# ValueCell 部署指南

## 目录
- [部署概述](#部署概述)
- [部署架构选择](#部署架构选择)
- [本地开发部署](#本地开发部署)
- [单机生产部署](#单机生产部署)
- [Docker部署](#docker部署)
- [分布式部署](#分布式部署)
- [云服务部署](#云服务部署)
- [安全配置](#安全配置)
- [监控与日志](#监控与日志)
- [备份与恢复](#备份与恢复)
- [性能优化](#性能优化)
- [故障排查](#故障排查)

---

## 部署概述

### 部署目标

ValueCell可以根据不同需求选择合适的部署方式：

| 场景 | 推荐部署方式 | 说明 |
|------|-------------|------|
| **开发测试** | 本地开发 | 使用`start.sh`快速启动 |
| **个人使用** | 单机生产 | 单台服务器，使用systemd管理 |
| **小团队** | Docker部署 | 容器化，易于迁移 |
| **企业级** | 分布式部署 | 多节点，高可用 |
| **云原生** | Kubernetes | 自动扩缩容，负载均衡 |

### 系统要求

**最低配置**（开发/测试）：
- CPU: 2核
- 内存: 4GB
- 存储: 20GB
- 网络: 10Mbps

**推荐配置**（生产）：
- CPU: 4核+
- 内存: 8GB+
- 存储: 100GB SSD
- 网络: 100Mbps+

**支持的操作系统**：
- ✅ Ubuntu 20.04+ / Debian 11+
- ✅ CentOS 8+ / RHEL 8+
- ✅ macOS 12+
- ✅ Windows 10+ (WSL2或原生)

---

## 部署架构选择

### 架构1：单机全栈部署

```
┌──────────────────────────────────────┐
│         单台服务器                    │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Frontend (React + Tauri)      │ │
│  │  Port: 1420                    │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Backend (FastAPI)             │ │
│  │  Port: 8000                    │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Agents (Local)                │ │
│  │  - Research Agent              │ │
│  │  - Auto Trading Agent          │ │
│  │  - Strategy Agent              │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Databases                     │ │
│  │  - SQLite: valuecell.db        │ │
│  │  - LanceDB: lancedb/           │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**适用场景**：个人使用、小规模部署

**优点**：
- 简单易部署
- 维护成本低
- 无网络延迟

**缺点**：
- 单点故障
- 难以扩展
- 资源竞争

### 架构2：前后端分离

```
┌─────────────────┐      HTTP/WS     ┌─────────────────┐
│  Frontend       │ ←──────────────→ │  Backend        │
│  (静态服务)      │                  │  + Agents       │
│  Nginx/Caddy    │                  │  (API服务器)     │
└─────────────────┘                  └────────┬────────┘
                                              │
                                     ┌────────┴────────┐
                                     │   Databases     │
                                     └─────────────────┘
```

**适用场景**：小团队、CDN加速

**优点**：
- 前端可独立部署到CDN
- 后端可独立扩展
- 更好的缓存策略

### 架构3：微服务架构

```
┌──────────┐     ┌──────────────────────────────────┐
│ Frontend │ ──→ │  API Gateway (负载均衡)           │
└──────────┘     └──────────┬───────────────────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
        ┌────────▼────────┐   ┌───────▼────────┐
        │  Backend Node 1 │   │  Backend Node 2│
        │  + Super Agent  │   │  + Super Agent │
        └────────┬────────┘   └────────┬───────┘
                 │                     │
                 │    A2A Protocol     │
                 └─────────┬───────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
  ┌────▼─────┐      ┌──────▼──────┐    ┌──────▼──────┐
  │ Research │      │ Auto Trading│    │  Strategy   │
  │  Agent   │      │    Agent    │    │   Agent     │
  └──────────┘      └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Shared Storage │
                  │  - PostgreSQL   │
                  │  - Redis        │
                  │  - S3/MinIO     │
                  └─────────────────┘
```

**适用场景**：企业级、高可用

**优点**：
- 高可用性
- 水平扩展
- 独立部署更新
- 负载均衡

**缺点**：
- 复杂度高
- 运维成本高
- 需要服务发现

---

## 本地开发部署

已在[README_CN.md](./README_CN.md)中详细介绍，这里是快速参考：

```bash
# 1. 克隆仓库
git clone https://github.com/ValueCell-ai/valuecell.git
cd valuecell

# 2. 配置环境变量
cp .env.example .env
# 编辑.env，添加API密钥

# 3. 启动
bash start.sh

# 4. 访问
# Frontend: http://localhost:1420
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 单机生产部署

### 环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装依赖
sudo apt install -y python3.12 python3.12-venv build-essential git curl

# 安装uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装Node.js (用于前端构建)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装bun
curl -fsSL https://bun.sh/install | bash
```

### 创建系统用户

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash valuecell
sudo usermod -aG sudo valuecell

# 切换到valuecell用户
sudo su - valuecell
```

### 部署应用

```bash
# 克隆仓库
cd /home/valuecell
git clone https://github.com/ValueCell-ai/valuecell.git
cd valuecell

# 配置环境变量
cp .env.example .env
vim .env  # 编辑配置

# 安装Python依赖
cd python
uv sync

# 构建前端
cd ../frontend
bun install
bun run build

# 初始化数据库
cd ../python
uv run python scripts/init_db.py
```

### 使用systemd管理服务

**创建后端服务**：

```bash
sudo vim /etc/systemd/system/valuecell-backend.service
```

```ini
[Unit]
Description=ValueCell Backend Service
After=network.target

[Service]
Type=simple
User=valuecell
Group=valuecell
WorkingDirectory=/home/valuecell/valuecell/python
Environment="PATH=/home/valuecell/.local/bin:/usr/local/bin:/usr/bin"
ExecStart=/home/valuecell/.local/bin/uv run python scripts/launch.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/valuecell/backend.log
StandardError=append:/var/log/valuecell/backend-error.log

[Install]
WantedBy=multi-user.target
```

**创建前端服务**（使用Nginx）：

```bash
# 安装Nginx
sudo apt install -y nginx

# 配置Nginx
sudo vim /etc/nginx/sites-available/valuecell
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端静态文件
    root /home/valuecell/valuecell/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 代理后端API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket支持
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/valuecell /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

### 启动服务

```bash
# 创建日志目录
sudo mkdir -p /var/log/valuecell
sudo chown valuecell:valuecell /var/log/valuecell

# 启动后端
sudo systemctl daemon-reload
sudo systemctl start valuecell-backend
sudo systemctl enable valuecell-backend

# 检查状态
sudo systemctl status valuecell-backend

# 查看日志
sudo journalctl -u valuecell-backend -f
```

### SSL证书配置（可选但推荐）

```bash
# 安装certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 证书会自动续期
sudo systemctl status certbot.timer
```

---

## Docker部署

> **2024年更新**：本节早期版本描述的 `python/Dockerfile`、`frontend/Dockerfile`
> 和其中的环境变量名（如 `OKX_SECRET_KEY`）是在实际验证之前写的示意性设计，
> 与仓库真实结构不符（真实的 OKX 变量名是 `OKX_API_SECRET` /
> `OKX_API_PASSPHRASE`，参见 `.env.example`）。现已替换为经过实际构建
> 验证的版本。完整的自托管发布说明见 **[docs/RELEASE_CN.md](./RELEASE_CN.md)**，
> 这里只保留一个精简版供快速参考。

真实文件位置：

```
docker/backend.Dockerfile     # FastAPI 后端 + 默认智能体（Research/AutoTrading/News）
docker/frontend.Dockerfile    # bun 构建 + nginx 静态托管，反代 /api/v1 到后端
docker/nginx.conf
docker/backend-entrypoint.sh  # 启动前校验 .env 是否配置了至少一个 LLM Provider Key
docker-compose.yml            # 仓库根目录
```

### 部署步骤（已用真实 `docker compose build` 验证过依赖安装与启动流程）

```bash
# 1. 准备环境变量（仓库根目录）
cp .env.example .env
vim .env   # 至少填写一个 Provider Key：OPENROUTER_API_KEY / GOOGLE_API_KEY / ...
           # 不填的话后端会给出明确报错并退出，而不是静默崩溃循环

# 2. 一键构建 + 启动
docker compose up -d --build

# 3. 查看日志
docker compose logs -f backend

# 4. 健康检查
curl http://localhost:8000/api/v1/system/health

# 5. 打开前端
open http://localhost:1420

# 6. 停止
docker compose down

# 7. 更新代码后重新部署
git pull
docker compose up -d --build
```

**重要限制（已在文档中明确标注，不是缺省疏漏）**：默认镜像只包含
Research/AutoTrading/News 三个智能体和 ValueCell 主智能体，**不包含**
`python/third_party/` 下的投资大师人格（Warren Buffett 等）和
TradingAgents 多分析师模式——它们各自需要独立的 Python 虚拟环境，
为了让镜像保持精简、构建保持真正的"一键"，这是 v1 阶段刻意做出的范围
取舍。需要这些智能体的用户目前仍需按 [CONFIGURATION_GUIDE](./CONFIGURATION_GUIDE.md)
手动配置。详见 [docs/RELEASE_CN.md](./RELEASE_CN.md)。

---

## 分布式部署

> **标注**：本节及以下的"云服务部署"是架构方向性指南（PostgreSQL、Redis、
> 负载均衡等如何组合），不是已验证可直接运行的配置——不像上面的 Docker
> 部署一节已经用真实 `docker compose build` 跑通过。如果要照着做，请把它
> 当作设计参考，自行验证每一步，而不是假设它和 `docker/` 目录下的文件
> 一样经过测试。

### 架构设计

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (Nginx/HAProxy)│
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │ Backend #1   │  │ Backend #2  │  │ Backend #3 │
    │ + Coordinator│  │ + Coordinator│  │ + Coordinator│
    └───────┬──────┘  └──────┬──────┘  └─────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │ A2A Protocol
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
┌──────▼──────┐      ┌───────▼────────┐    ┌──────▼──────┐
│ Agent Node 1│      │ Agent Node 2   │    │ Agent Node 3│
│ Research    │      │ Auto Trading   │    │ Strategy    │
│ News        │      │                │    │             │
└─────────────┘      └────────────────┘    └─────────────┘
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Shared Storage │
                    │   - PostgreSQL   │
                    │   - Redis        │
                    │   - MinIO (S3)   │
                    └──────────────────┘
```

### 组件配置

**1. 负载均衡器（Nginx）**：

```nginx
upstream valuecell_backend {
    least_conn;  # 最少连接算法
    server backend1.internal:8000 weight=1;
    server backend2.internal:8000 weight=1;
    server backend3.internal:8000 weight=1;
}

server {
    listen 80;
    server_name api.valuecell.com;

    location /api {
        proxy_pass http://valuecell_backend;
        proxy_http_version 1.1;

        # 健康检查
        proxy_next_upstream error timeout invalid_header http_500;

        # 超时设置
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /ws {
        proxy_pass http://valuecell_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # WebSocket超时
        proxy_read_timeout 3600s;
    }
}
```

**2. 使用PostgreSQL替代SQLite**：

```python
# python/configs/config.yaml
database:
  type: postgresql
  host: ${DB_HOST:db.internal}
  port: ${DB_PORT:5432}
  database: ${DB_NAME:valuecell}
  user: ${DB_USER:valuecell}
  password: ${DB_PASSWORD:}
  pool_size: 10
  max_overflow: 20
```

**3. 使用Redis做会话缓存**：

```python
# python/configs/config.yaml
redis:
  host: ${REDIS_HOST:redis.internal}
  port: ${REDIS_PORT:6379}
  password: ${REDIS_PASSWORD:}
  db: 0

conversation_store:
  type: redis
  ttl: 86400  # 24小时
```

**4. 远程智能体配置**：

```yaml
# configs/agents/research_agent.yaml
agent:
  name: research_agent
  mode: remote
  endpoint: http://agent-research.internal:8001
  timeout: 300
```

### 服务发现（Consul）

```bash
# 安装Consul
wget https://releases.hashicorp.com/consul/1.17.0/consul_1.17.0_linux_amd64.zip
unzip consul_1.17.0_linux_amd64.zip
sudo mv consul /usr/local/bin/

# 启动Consul服务器
consul agent -server -bootstrap-expect=1 \
  -data-dir=/tmp/consul \
  -bind=0.0.0.0 \
  -client=0.0.0.0

# 在每个智能体节点注册服务
curl -X PUT http://consul.internal:8500/v1/agent/service/register \
  -d '{
    "ID": "research-agent-1",
    "Name": "research-agent",
    "Address": "192.168.1.10",
    "Port": 8001,
    "Check": {
      "HTTP": "http://192.168.1.10:8001/health",
      "Interval": "10s"
    }
  }'
```

---

## 云服务部署

### AWS部署

**架构**：
- EC2: 后端和智能体
- RDS: PostgreSQL数据库
- ElastiCache: Redis缓存
- S3: 文件存储
- CloudFront: CDN
- ALB: 负载均衡

**部署步骤**：

```bash
# 1. 创建VPC和子网（使用Terraform或手动）

# 2. 启动RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier valuecell-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username valuecell \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 100

# 3. 启动ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id valuecell-redis \
  --engine redis \
  --cache-node-type cache.t3.medium \
  --num-cache-nodes 1

# 4. 创建S3 bucket
aws s3 mb s3://valuecell-data

# 5. 启动EC2实例（使用user-data脚本自动安装）
aws ec2 run-instances \
  --image-id ami-xxxxxxxx \
  --instance-type t3.large \
  --key-name your-key \
  --user-data file://install-script.sh

# 6. 配置ALB
# 使用AWS Console或CLI创建Application Load Balancer
```

### Google Cloud Platform部署

```bash
# 1. 创建GKE集群
gcloud container clusters create valuecell-cluster \
  --zone us-central1-a \
  --num-nodes 3

# 2. 部署应用
kubectl apply -f kubernetes/

# 3. 配置Cloud SQL
gcloud sql instances create valuecell-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# 4. 配置Memorystore (Redis)
gcloud redis instances create valuecell-redis \
  --size=1 \
  --region=us-central1
```

### Azure部署

```bash
# 1. 创建资源组
az group create --name valuecell-rg --location eastus

# 2. 创建AKS集群
az aks create \
  --resource-group valuecell-rg \
  --name valuecell-aks \
  --node-count 3

# 3. 创建Azure Database for PostgreSQL
az postgres server create \
  --resource-group valuecell-rg \
  --name valuecell-db \
  --location eastus \
  --admin-user valuecell \
  --admin-password YOUR_PASSWORD

# 4. 创建Azure Cache for Redis
az redis create \
  --resource-group valuecell-rg \
  --name valuecell-redis \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

---

## 安全配置

### 1. API密钥管理

**使用密钥管理服务**：

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name valuecell/api-keys \
  --secret-string '{
    "OPENROUTER_API_KEY": "sk-xxx",
    "OKX_API_KEY": "xxx",
    "OKX_API_SECRET": "xxx",
    "OKX_API_PASSPHRASE": "xxx"
  }'

# 在应用中读取
import boto3
secrets_client = boto3.client('secretsmanager')
response = secrets_client.get_secret_value(SecretId='valuecell/api-keys')
secrets = json.loads(response['SecretString'])
```

### 2. 网络安全

```bash
# 配置防火墙（UFW）
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 限制后端端口仅内部访问
sudo ufw deny 8000/tcp
# 或使用iptables更精细控制
sudo iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 8000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8000 -j DROP
```

### 3. HTTPS强制

```nginx
# Nginx配置
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # ...其他配置
}
```

### 4. 数据库安全

```sql
-- 创建只读用户（用于报表）
CREATE USER valuecell_readonly WITH PASSWORD 'xxx';
GRANT CONNECT ON DATABASE valuecell TO valuecell_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO valuecell_readonly;

-- 加密敏感字段
-- 使用pgcrypto扩展
CREATE EXTENSION pgcrypto;

-- 存储加密的API密钥
INSERT INTO api_keys (user_id, key_encrypted)
VALUES (1, pgp_sym_encrypt('actual_api_key', 'encryption_password'));

-- 查询时解密
SELECT pgp_sym_decrypt(key_encrypted::bytea, 'encryption_password')
FROM api_keys WHERE user_id = 1;
```

### 5. 限流保护

```python
# 使用Redis实现限流
from redis import Redis
from time import time

redis_client = Redis(host='localhost', port=6379)

def rate_limit(user_id: str, max_requests: int = 100, window: int = 60):
    """
    限流检查

    Args:
        user_id: 用户ID
        max_requests: 时间窗口内最大请求数
        window: 时间窗口（秒）
    """
    key = f"rate_limit:{user_id}"
    current_time = int(time())

    # 使用滑动窗口
    pipe = redis_client.pipeline()
    pipe.zadd(key, {current_time: current_time})
    pipe.zremrangebyscore(key, 0, current_time - window)
    pipe.zcard(key)
    pipe.expire(key, window)
    results = pipe.execute()

    request_count = results[2]

    if request_count > max_requests:
        raise Exception("Rate limit exceeded")

    return True
```

---

## 监控与日志

### Prometheus + Grafana监控

**Prometheus配置**：

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'valuecell-backend'
    static_configs:
      - targets: ['localhost:8000']
```

**应用暴露指标**：

```python
# python/valuecell/server/main.py
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import FastAPI

app = FastAPI()

# 定义指标
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def prometheus_middleware(request, call_next):
    with request_duration.time():
        response = await call_next(request)
        request_count.labels(method=request.method, endpoint=request.url.path).inc()
        return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### 日志聚合（ELK Stack）

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
```

---

## 备份与恢复

### 数据库备份

```bash
# PostgreSQL备份脚本
#!/bin/bash
BACKUP_DIR="/backup/valuecell"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/valuecell_$DATE.sql.gz"

# 创建备份
pg_dump -h localhost -U valuecell valuecell | gzip > "$BACKUP_FILE"

# 保留最近30天的备份
find "$BACKUP_DIR" -name "valuecell_*.sql.gz" -mtime +30 -delete

# 上传到S3
aws s3 cp "$BACKUP_FILE" s3://valuecell-backups/

echo "Backup completed: $BACKUP_FILE"
```

### 配置自动备份

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /home/valuecell/scripts/backup.sh >> /var/log/valuecell/backup.log 2>&1
```

### 恢复数据

```bash
# 从备份恢复
gunzip < valuecell_20240101_020000.sql.gz | psql -h localhost -U valuecell valuecell

# 从S3恢复
aws s3 cp s3://valuecell-backups/valuecell_20240101_020000.sql.gz .
gunzip < valuecell_20240101_020000.sql.gz | psql -h localhost -U valuecell valuecell
```

---

## 性能优化

### 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversation_items_conversation_id ON conversation_items(conversation_id);
CREATE INDEX idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

-- 分析查询计划
EXPLAIN ANALYZE SELECT * FROM conversations WHERE user_id = '123';

-- 定期VACUUM
VACUUM ANALYZE;
```

### 缓存策略

```python
from functools import lru_cache
from redis import Redis
import json

redis_client = Redis(host='localhost', port=6379)

# 内存缓存（适用于频繁访问的小数据）
@lru_cache(maxsize=1000)
def get_agent_config(agent_name: str):
    return load_config(agent_name)

# Redis缓存（适用于跨进程共享的数据）
def get_market_data_cached(symbol: str):
    cache_key = f"market:{symbol}"
    cached = redis_client.get(cache_key)

    if cached:
        return json.loads(cached)

    # 从API获取
    data = fetch_market_data(symbol)

    # 缓存5分钟
    redis_client.setex(cache_key, 300, json.dumps(data))

    return data
```

### 异步优化

```python
# 批量并发请求
async def fetch_multiple_symbols(symbols: List[str]):
    tasks = [fetch_market_data(symbol) for symbol in symbols]
    results = await asyncio.gather(*tasks)
    return dict(zip(symbols, results))

# 使用连接池
from aiohttp import ClientSession, TCPConnector

connector = TCPConnector(limit=100, limit_per_host=10)
session = ClientSession(connector=connector)
```

---

## 故障排查

### 常见问题

**1. 后端无法启动**

```bash
# 检查端口占用
sudo lsof -i :8000

# 检查日志
tail -f /var/log/valuecell/backend.log

# 检查依赖
uv run python -c "import valuecell; print('OK')"
```

**2. 数据库连接失败**

```bash
# 测试连接
psql -h localhost -U valuecell -d valuecell

# 检查防火墙
sudo ufw status

# 检查PostgreSQL日志
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**3. 智能体响应慢**

```python
# 添加超时配置
httpx_client = httpx.AsyncClient(timeout=30.0)

# 监控LLM API延迟
import time
start = time.time()
response = await llm.generate(prompt)
latency = time.time() - start
logger.info(f"LLM latency: {latency:.2f}s")
```

**4. 内存泄漏**

```bash
# 监控内存使用
watch -n 5 'ps aux | grep python'

# 使用memory_profiler
pip install memory-profiler
python -m memory_profiler scripts/launch.py
```

### 健康检查端点

```python
@app.get("/health")
async def health_check():
    checks = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "checks": {}
    }

    # 检查数据库
    try:
        await db.execute("SELECT 1")
        checks["checks"]["database"] = "ok"
    except Exception as e:
        checks["status"] = "unhealthy"
        checks["checks"]["database"] = f"error: {str(e)}"

    # 检查Redis
    try:
        redis_client.ping()
        checks["checks"]["redis"] = "ok"
    except Exception as e:
        checks["checks"]["redis"] = f"error: {str(e)}"

    # 检查磁盘空间
    import shutil
    disk = shutil.disk_usage("/")
    disk_usage_pct = (disk.used / disk.total) * 100
    if disk_usage_pct > 90:
        checks["status"] = "unhealthy"
    checks["checks"]["disk"] = f"{disk_usage_pct:.1f}% used"

    status_code = 200 if checks["status"] == "healthy" else 503
    return JSONResponse(content=checks, status_code=status_code)
```

---

## 总结

### 部署检查清单

上线前确保完成：

- [ ] 环境变量已配置（API密钥、数据库）
- [ ] 数据库已初始化
- [ ] SSL证书已配置
- [ ] 防火墙规则已设置
- [ ] 备份策略已实施
- [ ] 监控已启用
- [ ] 日志聚合已配置
- [ ] 健康检查端点可用
- [ ] 负载测试已完成
- [ ] 文档已更新

### 运维最佳实践

1. **自动化** - 使用CI/CD自动部署
2. **监控** - 24/7监控关键指标
3. **备份** - 每日自动备份
4. **安全** - 定期更新依赖，扫描漏洞
5. **文档** - 维护运维文档
6. **测试** - 在staging环境测试后再部署生产

---

**下一步**：
- [生产使用指南](./PRODUCTION_GUIDE_CN.md) - 实战技巧和优化建议
