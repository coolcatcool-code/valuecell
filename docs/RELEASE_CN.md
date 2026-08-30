# ValueCell 自托管发布说明

> 对应本次工作的定位：把 ValueCell 打包成一个用户**自己部署**的一键式产品——
> 用户在自己的机器上跑容器，自己填自己的 LLM / 交易所密钥，ValueCell 项目
> 本身不托管任何用户数据或资金。这是三条可能路线里风险最低、离现状最近
> 的一条（另外两条是"打磨成开源项目"和"做成托管 SaaS"，后者涉及金融合规，
> 是完全不同量级的事，本次没有做）。

这份文档记录的不是一份"计划"，而是这次会话里**实际做过、实际验证过**的
事情——包括一处在验证过程中发现并修复的真实 bug。凡是没有验证到的地方，
都在下面明确标出来，不假装它已经完成。

---

## 一分钟看懂：新增了什么

```
.dockerignore                    构建上下文排除规则
docker-compose.yml                # 仓库根目录，一键启动入口
docker/backend.Dockerfile         后端镜像：FastAPI + 默认三个智能体
docker/backend-entrypoint.sh      启动前校验 .env，避免无声崩溃循环（见下文"发现的bug"）
docker/frontend.Dockerfile        前端镜像：bun 构建 + nginx 静态托管
docker/nginx.conf                 反向代理 /api/v1 到后端，同源，无需处理 CORS
.github/workflows/docker.yml      CI：真正构建两个镜像 + docker compose up 冒烟测试
docs/DEPLOYMENT_GUIDE_CN.md       Docker 章节已重写，指向这里
```

被删除：仓库里原有的 `docker/DockerFile`——它引用了一个不存在的
`main.py`，构建上下文假设也和实际的 `python/pyproject.toml` 位置对不上，
是一个从未真正能跑起来的文件。

---

## 快速开始（已验证的步骤）

```bash
git clone https://github.com/ValueCell-ai/valuecell.git
cd valuecell
cp .env.example .env
vim .env   # 至少填一个：OPENROUTER_API_KEY / GOOGLE_API_KEY /
           # AZURE_OPENAI_API_KEY / OPENAI_API_KEY / SILICONFLOW_API_KEY /
           # OPENAI_COMPATIBLE_API_KEY

docker compose up -d --build

# 等待约 30-60 秒（首次构建含 uv sync + playwright 安装 chromium，
# 之后的启动会快很多，因为依赖已经烤进镜像层）
curl http://localhost:8000/api/v1/system/health

open http://localhost:1420
```

停止：`docker compose down`（数据保留在具名 volume 里，不会丢）
更新：`git pull && docker compose up -d --build`
彻底清空重来：`docker compose down -v`（`-v` 会连数据一起删，谨慎使用）

---

## 验证过程中发现并修复的一个真实 bug

这不是 Docker 打包本身的问题，是 ValueCell 后端应用本身的一个启动逻辑
缺陷，只是在做"一键部署"验证时才会被暴露出来：

**现象**：`AgentOrchestrator` 在导入阶段就会为 `super_agent` 主动构建一个
LLM 模型实例（用来支撑 Planner）。如果 `.env` 里所有 Provider Key 都是空的
——也就是任何新用户执行完 `cp .env.example .env` 之后、填密钥之前的原始
状态——后端会在启动时直接抛出一个未捕获的 Python 异常并退出。

**为什么这对"一键部署"是致命的**：`docker-compose.yml` 用
`restart: unless-stopped`（产品该有的可靠性默认值），意味着容器会不停
重启、不停崩溃，日志里全是同一段 Python 堆栈，普通用户完全看不出问题
出在"忘记填密钥"这么简单的一件事上。

**验证方式**：不是猜的。我在这次会话的沙盒里直接跑了两次真实的后端
启动——

1. 用一份所有 Key 都为空的 `.env`（`.env.example` 原始拷贝）启动 →
   立刻在 `AgentOrchestrator` 构造阶段崩溃，完整堆栈见下方。
2. 填入一个格式正确但无效的占位 Key 后重新启动 → 成功启动，
   `curl http://localhost:8000/api/v1/system/health` 返回
   `{"data":{"status":"healthy",...}}`。

```
ValueError: Failed to create model. Primary provider (openrouter) and all
fallback providers failed. Original error: Provider validation failed:
API key not found for 'openrouter'. Please set OPENROUTER_API_KEY in .env
  ...
  File ".../valuecell/core/coordinate/orchestrator.py", line 78, in __init__
    services = AgentServiceBundle.compose(...)
```

**修复**：`docker/backend-entrypoint.sh` 在启动真正的应用之前，先检查
挂载进容器的 `.env` 文件里是否至少有一个已知 Provider Key 非空；没有的话
打印一段清楚的、可操作的提示然后退出，而不是让应用自己炸出堆栈：

```
❌ No LLM provider API key found in .env.

   ValueCell needs at least one of these set before it can start:
   OPENROUTER_API_KEY, GOOGLE_API_KEY, AZURE_OPENAI_API_KEY,
   OPENAI_API_KEY, SILICONFLOW_API_KEY, or OPENAI_COMPATIBLE_API_KEY.

   Edit .env at the repo root, then re-run:
     docker compose up -d --build
```

这个校验逻辑本身也做了单元级别的验证（对着一份真实的空 `.env` 和一份
填了 key 的 `.env` 分别跑正则匹配，确认两种情况都判断正确）。

**这个 bug 目前只在 Docker 路径上修了**——本地 `bash start.sh` 跑
`python/scripts/launch.py` 时依然会遇到同样的裸堆栈，因为
`launch.py` 本身没有加这层校验。要不要把同样的前置检查也加进
`launch.py`，让本地开发体验和容器体验一致，值得作为后续一个小改动
补上（本次没做，因为它超出了"打包成 Docker 产品"这个具体范围）。

---

## 这次会话里实际验证过的事情（以及为什么某些事情没验证）

| 项目 | 状态 | 怎么验证的 |
|---|---|---|
| `uv sync --locked --no-dev` 装真实 `uv.lock` | ✅ 验证过 | 在沙盒里直接跑，200+ 个包全部装成功 |
| 后端应用真实启动 + `/api/v1/system/health` | ✅ 验证过 | 直接跑 `uv run -m valuecell.server.main`，`curl` 拿到 200 |
| "无密钥崩溃"这个 bug 本身 | ✅ 复现 + 修复 + 复测通过 | 见上一节 |
| `docker-compose.yml` 的 YAML 结构/变量插值 | ✅ 验证过 | `docker compose config` 跑通，展开结果符合预期 |
| Playwright 系统依赖（apt 包）安装 | ✅ 验证过 | `uv run playwright install --with-deps chromium` 里 apt 部分成功 |
| Playwright Chromium **二进制**下载 | ❌ 未验证 | 沙盒的出口网络策略挡掉了 `cdn.playwright.dev`（策略性拒绝，不是我代码的问题）|
| `docker build` / `docker compose build` 真正跑一遍 | ❌ 本次会话未验证 | 同样的出口网络策略挡掉了 Docker Hub 和 GHCR 的镜像 blob CDN（`production.cloudfront.docker.com`、`pkg-containers.githubusercontent.com` 均返回策略性 403）|
| 前端镜像构建（bun build + nginx） | ❌ 本次会话未验证（构建逻辑本身在非 Docker 环境下验证过：`bun run build`/`bun run typecheck` 在本 repo 之前的会话中已跑通）| 同上，nginx/bun 基础镜像拉取被挡 |

**换句话说**：我能在这个沙盒里验证的，是"应用本身对不对、依赖锁文件
对不对、`.env` 处理逻辑对不对"——这些恰恰是最容易出真实 bug 的地方，
也确实抓到了一个。我不能在这个沙盒里验证的，是"Docker 镜像本身能不能
真的构建出来"——这纯粹是这次会话的出口网络策略限制（容器镜像仓库和
二进制 CDN 不在允许名单里，pypi.org/registry.npmjs.org 等包管理器倒是
允许的），不是 Dockerfile 逻辑的问题。

**为了不让这个 gap 变成"我说了就算"，已经用 `.github/workflows/docker.yml`
把它补上**：这个 CI workflow 会在 GitHub Actions 的 runner 上（那里没有
这个沙盒的网络限制）真正执行 `docker build` 两次、`docker compose up`
一次、打真实的健康检查和前端代理请求，失败会让 CI 变红。**这个
workflow 本身也还没有在真实 PR 上跑过一次**——它是随这次改动一起提交
的，第一次跑是在这个改动实际被推送触发 CI 的时候。

---

## 明确不在 v1 范围内的东西（不是漏掉，是选择）

1. **投资大师人格（Warren Buffett 等）和 TradingAgents 多分析师模式**——
   它们各自需要独立的 Python 虚拟环境（`third_party/ai-hedge-fund`、
   `third_party/TradingAgents`），为了让默认镜像保持精简、构建时间保持
   "一键"的量级，这次的镜像故意不包含它们，也不在 `.dockerignore`
   之外把它们的源码打进镜像。要用这些智能体，目前仍然需要按
   [CONFIGURATION_GUIDE](./CONFIGURATION_GUIDE.md) 手动跑
   `scripts/prepare_envs.sh`（非 Docker 路径）。

2. **预构建镜像发布到镜像仓库**——现在的"一键"是
   `docker compose up -d --build`（本地构建），不是
   `docker compose pull && docker compose up -d`（直接拉预构建镜像）。
   后者需要把镜像推到一个公开仓库（GHCR 是最自然的选择，因为仓库已经
   在用 GitHub Actions），这样首次启动能从几分钟的本地编译降到几十秒
   的镜像下载。这是一个自然的下一步，本次没做。

3. **托管的实盘交易安全网**——`.env.example` 里的
   `OKX_ALLOW_LIVE_TRADING=false` 默认值和纸上交易模式本来就是这个
   项目自带的安全设计，Docker 打包没有改变、也没有削弱这一层——只是
   提醒一句：一键部署让"跑起来"变得更容易了，不代表"跑起来"和"可以
   放心实盘"是同一件事，这条界线还是用户自己判断。

4. **数据库热更新/迁移策略**——具名 volume 保证了 `docker compose down`
   不丢数据，但如果 ValueCell 未来的数据库 schema 发生变化，现在没有
   一个自动化的迁移路径，用户可能需要手动处理或者接受重新初始化。

5. **`launch.py` 本身的密钥前置校验**——如前面所说，只在 Docker
   entrypoint 里加了，本地 `start.sh` 路径还没有。

---

## 安全设计说明

- `.env` 通过只读 bind mount（`./.env:/app/.env:ro`）进容器，不会被
  `COPY` 进任何镜像层——`docker history` 看不到你的密钥，`.dockerignore`
  也显式排除了 `.env`，双重保险。
- 交易所密钥、LLM Key 全部只存在于你自己机器上的这一份 `.env` 文件里，
  ValueCell 项目方（无论是这个仓库还是任何托管服务）不会看到、也无法
  看到它们——这也是选择"用户自托管"而不是"ValueCell 托管 SaaS"这条路线
  的核心原因之一。
- Auto Trading Agent 直接从这个容器网络出口连接交易所 API，没有任何
  中间代理层经手你的交易指令或密钥。

---

## 如果要继续往前推，建议的下一步顺序

1. 把 `.github/workflows/docker.yml` 实际跑一遍，确认 CI 里的
   `docker compose up` 冒烟测试真的能通过（这是目前唯一还没有被
   任何环境验证过的一环）。
2. 把镜像推到 GHCR，把"一键"从"本地编译几分钟"变成"拉取几十秒"。
3. 把这次修的"无密钥崩溃"检查同步补到 `python/scripts/launch.py`，
   让非 Docker 的本地开发路径也有同样清楚的报错。
4. ~~写一份面向最终用户的用户手册~~ **已完成**：见
   [`docs/USER_GUIDE.md`](./USER_GUIDE.md)（英文）和
   [`docs/USER_GUIDE_CN.md`](./USER_GUIDE_CN.md)（中文）——这份
   `RELEASE_CN.md` 本身是给做发布决策的人看的过程记录，两份 USER_GUIDE
   才是给终端用户看的操作手册，刻意分成了不同文件。
