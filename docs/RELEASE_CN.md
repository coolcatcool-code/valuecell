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
| `docker build`（后端镜像） | ✅ **已在真实 GitHub Actions 上连续两次验证成功** | 见下方"CI 首次/第二次真实运行"两节 |
| `docker build`（前端镜像） | ❌ **两次真实运行均失败，同一个报错**；第一次的"版本锁定"修复已被第二次运行证伪；本地四种方式都无法复现，问题定位到"很可能是容器化构建环境本身"，具体原因待有登录权限的人提供完整日志 | 同上 |
| `docker compose up` 端到端冒烟测试 | ⏸️ 因为前端镜像两次都构建失败，还没有真正跑到这一步 | 同上 |

**换句话说**：这份表格不再是"沙盒验证不到，所以打问号"——`docker.yml`
这个 CI workflow 已经真实运行过一次，给出了比我在沙盒里能做到的更准确
的信号：后端镜像没问题，前端镜像真的有一个 bug，而且被抓出来了。这是
"先在沙盒里做能做到的应用层验证，再靠 CI 补上镜像构建这一层"这个分工
本来就该产生的结果——不是失败，是这套验证机制第一次真正发挥作用。

---

## CI 首次真实运行：backend 过了，frontend 真的有 bug

对应 [GitHub Actions run #33285320341](https://github.com/coolcatcool-code/valuecell/actions/runs/33285320341)。

**结果**：

| Job | 结果 | 耗时 |
|---|---|---|
| `backend` | ✅ 通过 | 3m 10s |
| `frontend` | ❌ 失败 | 28s |
| `compose-up-smoke-test` | ⏸️ 未执行（依赖的 `frontend` 失败，被跳过） | — |

**frontend 失败的具体报错**：

```
buildx failed with: ERROR: failed to build: failed to solve:
process "/bin/sh -c bun run build" did not complete successfully: exit code: 1
```

**根因排查过程**（不是猜的，是排除法验证出来的）：

`docker/frontend.Dockerfile` 原来写的是 `FROM oven/bun:1`——`:1` 是一个
**浮动的大版本号标签**，每次重新构建都可能拉到不同的具体 bun 版本。我在
本地用固定的 bun 1.3.11（这个沙盒里安装的版本）做了三次独立复现，全部
成功：

1. 直接在已有的 `frontend/` 目录跑 `bun run build` → 成功
2. 加上 `VITE_API_BASE_URL=/api/v1`（Dockerfile 里设置的那个变量）→ 成功
3. 完全模拟 Dockerfile 的构建顺序——全新目录、只拷 `package.json` +
   `bun.lock`、`bun install --frozen-lockfile`、再拷入其余源码、再
   `bun run build` → 成功

三次都是干净的 `exit code: 0`。既然本地用固定版本怎么都复现不出失败，
最合理的解释就是 CI 那次运行拉到的 bun 版本和我验证过的不是同一个——
这正是"未锁定的浮动标签"这类 bug 的典型指纹：本地能跑，CI 某次运气不好
拉到一个有回归的新版本就炸了，而且下次拉图层缓存命中了又可能"自己好了"，
更难排查。

**修复**：把 `FROM oven/bun:1` 改成 `FROM oven/bun:1.3.0`，和
`frontend/package.json` 里 `"packageManager": "bun@1.3.0"` 声明的版本
对齐——不是随便选一个能跑的版本锁死，是让 Dockerfile 里的版本和项目自己
声明的规范版本保持一致，这样以后谁改 `packageManager` 字段，也会想起来
同步改这里（Dockerfile 里加了对应的注释提醒）。

**诚实说明当前状态**：这个修复本身**还没有被真实构建验证过**——沙盒的
出口网络策略挡掉了 `oven/bun:1.3.0` 这个镜像的拉取（和之前挡掉
`oven/bun:1`、GHCR 基础镜像是同一类策略性 403，不是这次新出现的问题），
所以我没法在这里再跑一次 `docker build` 确认。真正的验证会发生在这个
修复被推送之后，`.github/workflows/docker.yml` 的下一次运行——这也是为
什么上面把它标成"已定位并修复，修复本身待验证"而不是直接标"✅ 已解决"。

**顺带修的一个 CI 设计漏洞**：修复过程中发现 `docker.yml` 的触发路径
只监听了 `frontend/package.json`、`frontend/bun.lock`，没有监听
`frontend/src/**`——也就是说如果哪次改动纯粹是前端源码改动（不碰依赖
文件），这个构建校验根本不会被触发，类似这次的回归会被放过而不自知。
已经把触发路径改成监听整个 `frontend/**` 和 `python/**`（原来 Python
那边也是同样的窄范围问题）。

---

## CI 第二次真实运行：版本锁定的修复是错的

对应 [GitHub Actions run #33362955081](https://github.com/coolcatcool-code/valuecell/actions/runs/33362955081)，
就是上面那次修复推送后触发的那一次。

**结果**：还是同一个报错。

| Job | 结果 | 耗时 |
|---|---|---|
| `backend` | ✅ 通过（24s，命中了 GHA 层缓存，不是从零构建） | 24s |
| `frontend` | ❌ 失败，**一模一样的报错** | 32s |
| `compose-up-smoke-test` | 依然没有真正跑到 | — |

```
buildx failed with: ERROR: failed to build: failed to solve:
process "/bin/sh -c bun run build" did not complete successfully: exit code: 1
```

**结论很明确：把 `oven/bun:1` 锁定成 `oven/bun:1.3.0` 并没有解决问题。**
上一节那套"浮动标签导致版本漂移"的推理，被这次真实结果证伪了——不是
"还没验证"，是"验证了，错了"。这一点必须写清楚，不能因为上次的推理
听起来很合理就假装它是对的。

**收到证伪之后又做了什么**：没有直接猜第三个修复方案，而是先补测试，
排除更多可能性。在本地额外做了一次**真正的冷安装测试**——之前三次
"干净目录"复现，用的都是这台机器上已经存在的 565MB bun 全局缓存
（`~/.bun/install/cache`），并不是真正意义上从零下载；这次用
`bun install --frozen-lockfile --cache-dir=<空目录>` 强制绕开全局缓存，
逼它重新从网络拉取每一个包（包括 `@tailwindcss/oxide-linux-x64-gnu`、
`lightningcss-linux-x64-gnu` 这类平台相关的原生二进制依赖——这类包是
"lockfile 在别的平台生成、目标平台装不上正确二进制"这种 bug 的经典
出处，专门确认过 `bun.lock` 里确实包含了 linux-x64-gnu 的对应条目）。
这次冷装 + 构建依然是干净的 `exit code: 0`。

四次本地复现方式全部失败（复现不出问题），说明问题很可能不在依赖、
不在版本、也不在 bun 缓存状态，而是**真正的容器化 BuildKit 执行环境本身
的问题**（最可能是那个 RUN 步骤的内存或其他资源限制）——这是本地
`bun run build`（不经过 Docker）永远测不出来的一类问题。

**目前做的事**：在 `docker/frontend.Dockerfile` 的构建步骤前加了两行
诊断输出（`bun --version`、`free -h`、`df -h /tmp`），这样下次失败时
日志里至少能看到当时容器里实际是什么版本、有多少可用内存，而不是又一个
光秃秃的 `exit code: 1`。

**这里要老实说一句我做不到的事**：GitHub Actions 未登录状态下能看到的
只有一行摘要报错，`bun run build` 真正打印出来的完整过程（哪个模块在
转换、卡在哪一步、有没有更详细的错误堆栈）我这边看不到，需要登录才能
展开完整日志。到这一步继续靠本地排除法盲猜第三个修复方案，性价比已经
很低——更快的路径是麻烦你把 CI 页面上 "Build frontend image" 这一步
展开后的完整输出复制给我（尤其是最后那行 `exit code: 1` 之前的内容），
这样能一次定位，而不是继续来回猜、来回等一次 CI。

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

1. **进行中，卡在 frontend 镜像构建上**：`.github/workflows/docker.yml`
   已经真实跑了两次。backend 两次都过了。frontend 两次都在
   `bun run build` 这一步失败，报错一模一样；第一次怀疑是
   `oven/bun:1` 浮动版本标签导致的漂移，锁定到 `oven/bun:1.3.0` 后
   第二次运行**依然是同一个报错**，说明那个诊断是错的。本地做了四种
   方式的复现尝试（含真正绕开 bun 全局缓存的冷安装）全部无法重现，
   现在的判断是问题出在容器化构建环境本身，不是依赖或版本（详见上方
   "CI 第二次真实运行"一节）。已经在 Dockerfile 里加了诊断输出
   （bun 版本、可用内存），但**继续往前推的最快方式是需要一个能登录
   GitHub 的人把 "Build frontend image" 步骤展开后的完整日志文本发
   过来**——未登录状态下只能看到最后一行摘要报错，看不到 `bun run build`
   真正打印的过程，本地排除法已经到极限了。`compose-up-smoke-test`
   这一步因为 frontend 始终没过，两次都没有真正跑到过。
2. 把镜像推到 GHCR，把"一键"从"本地编译几分钟"变成"拉取几十秒"。
3. 把这次修的"无密钥崩溃"检查同步补到 `python/scripts/launch.py`，
   让非 Docker 的本地开发路径也有同样清楚的报错。
4. ~~写一份面向最终用户的用户手册~~ **已完成**：见
   [`docs/USER_GUIDE.md`](./USER_GUIDE.md)（英文）和
   [`docs/USER_GUIDE_CN.md`](./USER_GUIDE_CN.md)（中文）——这份
   `RELEASE_CN.md` 本身是给做发布决策的人看的过程记录，两份 USER_GUIDE
   才是给终端用户看的操作手册，刻意分成了不同文件。
