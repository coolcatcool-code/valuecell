# CLAUDE.md - ValueCell AI Assistant Guide

> Comprehensive guide for AI assistants working with the ValueCell codebase

## Project Overview

**ValueCell** is a community-driven, multi-agent platform for financial applications. It provides a team of AI-powered investment agents to help with stock selection, research, tracking, and trading.

- **Type**: Full-stack financial multi-agent platform
- **Backend**: Python 3.12+ (FastAPI, a2a-sdk, agno framework)
- **Frontend**: React 19 + TypeScript (React Router, Tauri for desktop)
- **License**: Apache 2.0
- **Version**: 0.1.0

### Key Capabilities

- **Multi-Agent System**: DeepResearch, AutoTrading, News Retrieval, Strategy agents
- **Multiple LLM Providers**: OpenRouter, SiliconFlow, Google, OpenAI, Azure
- **Market Data**: US, Crypto, Hong Kong, China markets
- **Live Trading**: OKX exchange integration (with guardrails)
- **Frameworks**: Langchain, Agno, A2A Protocol

---

## Repository Structure

```
valuecell/
├── python/                          # Python backend
│   ├── valuecell/                   # Main Python package
│   │   ├── agents/                  # Agent implementations
│   │   │   ├── auto_trading_agent/
│   │   │   ├── research_agent/
│   │   │   ├── news_agent/
│   │   │   ├── strategy_agent/
│   │   │   └── utils/
│   │   ├── core/                    # Core framework
│   │   │   ├── agent/              # Base agent classes
│   │   │   ├── conversation/       # Conversation management
│   │   │   ├── coordinate/         # Orchestrator
│   │   │   ├── event/              # Event routing & buffering
│   │   │   ├── plan/               # Planning service
│   │   │   ├── super_agent/        # Triage agent
│   │   │   └── task/               # Task execution
│   │   ├── server/                  # FastAPI backend
│   │   │   ├── api/                # REST endpoints
│   │   │   ├── db/                 # Database models
│   │   │   └── services/           # Business logic
│   │   ├── adapters/                # External integrations
│   │   ├── config/                  # Configuration management
│   │   └── utils/                   # Shared utilities
│   ├── configs/                     # YAML configurations
│   │   ├── agents/                 # Agent-specific configs
│   │   ├── providers/              # LLM provider configs
│   │   ├── agent_cards/            # UI metadata
│   │   └── locales/                # i18n files
│   ├── scripts/                     # Utility scripts
│   ├── third_party/                 # External dependencies
│   ├── pyproject.toml              # Python project config
│   └── uv.lock                     # Dependency lock file
│
├── frontend/                        # React frontend
│   ├── src/
│   │   ├── api/                    # API client
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── store/                  # State management (Zustand)
│   │   ├── routes/                 # Route definitions
│   │   └── types/                  # TypeScript types
│   ├── src-tauri/                  # Tauri desktop app
│   ├── package.json                # Node dependencies
│   ├── bun.lock                    # Bun lock file
│   ├── biome.json                  # Biome config
│   └── vite.config.ts              # Vite config
│
├── docs/                            # Documentation
│   ├── CONFIGURATION_GUIDE.md
│   ├── CORE_ARCHITECTURE.md
│   ├── CONTRIBUTE_AN_AGENT.md
│   └── OKX_SETUP.md
│
├── .env.example                     # Environment template
├── start.sh                         # Launch script (macOS/Linux)
├── start.ps1                        # Launch script (Windows)
└── Makefile                         # Common tasks

```

---

## Technology Stack

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Python** | Runtime | 3.12+ |
| **uv** | Package manager | Latest |
| **FastAPI** | Web framework | 0.104.0+ |
| **Pydantic** | Data validation | 2.0.0+ |
| **a2a-sdk** | Agent-to-Agent protocol | 0.3.4+ |
| **agno** | Multi-agent framework | 2.0-3.0 |
| **SQLAlchemy** | ORM | 2.0.43+ |
| **aiosqlite** | Async SQLite | 0.19.0+ |
| **yfinance** | Market data | 0.2.65+ |
| **akshare** | Chinese market data | 1.17.44+ |
| **edgartools** | SEC filings | 4.12.2+ |
| **python-okx** | OKX exchange | 0.4.0+ |
| **crawl4ai** | Web scraping | 0.7.4+ |
| **loguru** | Logging | 0.7.3+ |

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 19.2.0 |
| **TypeScript** | Type safety | 5.9.3+ |
| **bun** | Package manager/runtime | 1.3.0+ |
| **React Router** | Routing | 7.9.4+ |
| **Vite** | Build tool | 7.1.12+ |
| **Tauri** | Desktop app framework | 2.9.0+ |
| **Zustand** | State management | 5.0.8+ |
| **TanStack Query** | Data fetching | 5.90.5+ |
| **Radix UI** | Component primitives | Latest |
| **Tailwind CSS** | Styling | 4.1.16+ |
| **Biome** | Linting/formatting | 2.3.1+ |
| **ECharts** | Charts | 6.0.0 |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Ruff** | Python linting & formatting |
| **pytest** | Python testing |
| **Biome** | JavaScript/TypeScript linting |
| **isort** | Import sorting |

---

## Development Setup

### Prerequisites

- **Python**: 3.12 or higher
- **uv**: [Install guide](https://docs.astral.sh/uv/getting-started/installation/)
- **bun**: [Install guide](https://bun.sh)
- **Git**: Version control

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/ValueCell-ai/valuecell.git
cd valuecell

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Launch application
bash start.sh  # macOS/Linux
# or
.\start.ps1    # Windows PowerShell
```

The `start.sh` script will:
1. Auto-install `uv` and `bun` if missing (macOS/Linux)
2. Sync Python dependencies
3. Initialize database
4. Install frontend dependencies
5. Start backend and frontend

### Manual Setup

```bash
# Backend only
cd python
uv sync
uv run valuecell/server/db/init_db.py
uv run scripts/launch.py

# Frontend only
cd frontend
bun install
bun run dev
```

### Access Points

- **Web UI**: http://localhost:1420
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Logs**: `logs/{timestamp}/*.log`

---

## Architecture Overview

### Core Architecture Pattern

ValueCell uses an **event-driven, streaming multi-agent architecture**:

```
User Input → Orchestrator → Super Agent (triage)
                ↓
        ┌───────┴────────┐
        ↓                ↓
   Direct Answer    Planner (with HITL)
                         ↓
                  Execution Plan
                         ↓
                  Task Executor
                         ↓
                  A2A Remote Agents
                         ↓
         Event Routing & Response Buffering
                         ↓
              Store & Stream to UI
```

### Key Components

1. **Orchestrator** (`valuecell.core.coordinate`)
   - Entry point for user requests
   - Coordinates SuperAgent, Planner, TaskExecutor
   - Manages conversation state

2. **Super Agent** (`valuecell.core.super_agent`)
   - Triages user input
   - Can answer directly or handoff to planner
   - Enriches queries before planning

3. **Planner** (`valuecell.core.plan`)
   - Creates execution plans
   - Supports Human-In-The-Loop (HITL) for clarification
   - Breaks down complex tasks

4. **Task Executor** (`valuecell.core.task`)
   - Executes plan tasks
   - Calls remote agents via A2A protocol
   - Handles task dependencies

5. **Event Response Service** (`valuecell.core.event`)
   - Routes task status events to typed responses
   - Buffers and annotates responses
   - Persists to conversation store

6. **Agents** (`valuecell.agents.*`)
   - Specialized financial agents
   - Run as independent processes
   - Communicate via A2A protocol

### Configuration System

**Three-tier priority**:
1. Environment variables (highest)
2. `.env` file
3. YAML files in `python/configs/` (lowest)

**Key config files**:
- `python/configs/config.yaml` - Main config
- `python/configs/providers/*.yaml` - LLM providers
- `python/configs/agents/*.yaml` - Agent configs
- `python/configs/agent_cards/*.json` - UI metadata

---

## Development Workflows

### Creating a New Agent

**Step 1: Create directory structure**
```bash
mkdir -p python/valuecell/agents/my_agent
touch python/valuecell/agents/my_agent/{__init__.py,__main__.py,core.py}
```

**Step 2: Implement agent logic** (`core.py`)
```python
from typing import AsyncGenerator, Optional, Dict
from valuecell.core.types import BaseAgent, StreamResponse
from valuecell.core.agent import streaming

class MyAgent(BaseAgent):
    async def stream(
        self,
        query: str,
        conversation_id: str,
        task_id: str,
        dependencies: Optional[Dict] = None,
    ) -> AsyncGenerator[StreamResponse, None]:
        """Process queries and stream responses."""
        yield streaming.message_chunk("Processing...")
        yield streaming.message_chunk(f"Result: {query}")
        yield streaming.done()
```

**Step 3: Add entry point** (`__main__.py`)
```python
import asyncio
from valuecell.core.agent import create_wrapped_agent
from .core import MyAgent

if __name__ == "__main__":
    agent = create_wrapped_agent(MyAgent)
    asyncio.run(agent.serve())
```

**Step 4: Add configuration** (`python/configs/agents/my_agent.yaml`)
```yaml
name: my_agent
model_id: gpt-4
temperature: 0.7
max_tokens: 4000
streaming: true
```

**Step 5: Add agent card** (`python/configs/agent_cards/my_agent.json`)
```json
{
  "agent_name": "my_agent",
  "display_name": "My Agent",
  "description": "Description of what this agent does",
  "icon": "icon-name",
  "category": "trading"
}
```

**Step 6: Test agent**
```bash
cd python
uv run -m valuecell.agents.my_agent
```

See `docs/CONTRIBUTE_AN_AGENT.md` for complete details.

### Running Tests

```bash
# Python tests
cd python
uv run pytest                    # All tests
uv run pytest -v                 # Verbose
uv run pytest --cov              # With coverage
uv run pytest path/to/test_file.py  # Specific file

# Frontend tests (when available)
cd frontend
bun test
```

### Code Formatting & Linting

**Python:**
```bash
cd python
uv run ruff check .              # Lint
uv run ruff check --fix .        # Auto-fix
uv run ruff format .             # Format
uv run isort .                   # Sort imports
```

**Frontend:**
```bash
cd frontend
bun run lint                     # Lint
bun run lint:fix                 # Auto-fix
bun run format                   # Check formatting
bun run format:fix               # Format
bun run check:fix                # All fixes
```

### Database Management

```bash
# Initialize/reset database
cd python
uv run valuecell/server/db/init_db.py

# If schema changes, delete and reinit:
rm -rf lancedb/ valuecell.db .knowledgebase/
uv run valuecell/server/db/init_db.py
```

### Git Workflow

**Branch naming convention:**
- Feature: `feature/description`
- Bug fix: `fix/description`
- Claude branches: `claude/claude-md-{session-id}`

**Commit messages:**
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Keep first line under 72 characters
- Be descriptive about "why" not just "what"

---

## Key Conventions

### Python Code Style

- **Line length**: 88 characters (Ruff default)
- **Indentation**: 4 spaces
- **Quotes**: Double quotes for strings
- **Imports**: Sorted with isort (black profile)
- **Type hints**: Required for public APIs
- **Async**: Prefer async/await for I/O operations

**Example:**
```python
from typing import Optional

async def fetch_market_data(
    symbol: str,
    start_date: Optional[str] = None,
) -> dict:
    """
    Fetch market data for a symbol.

    Args:
        symbol: Stock ticker symbol
        start_date: ISO format date string

    Returns:
        Dictionary with market data
    """
    # Implementation
    return {}
```

### Frontend Code Style

- **Indentation**: 2 spaces
- **Quotes**: Double quotes (enforced by Biome)
- **Components**: PascalCase
- **Hooks**: camelCase starting with `use`
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase with `I` prefix for interfaces

**Example:**
```typescript
interface IUserData {
  id: string;
  name: string;
}

const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, isLoading } = useUserData(userId);

  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.name}</div>;
};
```

### File Naming

- **Python modules**: `snake_case.py`
- **Python tests**: `test_*.py` or `*_test.py`
- **React components**: `PascalCase.tsx`
- **Utilities**: `camelCase.ts`
- **Types**: `types.ts` or `*.types.ts`
- **Config files**: `kebab-case.yaml` or `kebab-case.json`

### Agent Development Patterns

1. **Always subclass `BaseAgent`** from `valuecell.core.types`
2. **Implement `stream()` method** with proper type hints
3. **Use `streaming` helpers**:
   - `streaming.message_chunk()` - Send text
   - `streaming.tool_call()` - Log tool usage
   - `streaming.done()` - Signal completion
   - `streaming.error()` - Report errors
4. **Entry point in `__main__.py`**:
   ```python
   agent = create_wrapped_agent(YourAgent)
   asyncio.run(agent.serve())
   ```
5. **Configuration in YAML** at `configs/agents/your_agent.yaml`
6. **UI metadata in JSON** at `configs/agent_cards/your_agent.json`

### Event Streaming Pattern

All agents communicate via **async generators** yielding `StreamResponse` objects:

```python
async def stream(...) -> AsyncGenerator[StreamResponse, None]:
    # Yield chunks as processing happens
    yield streaming.message_chunk("Step 1 complete")
    yield streaming.message_chunk("Step 2 complete")
    # Always end with done()
    yield streaming.done()
```

### Configuration Access

```python
from valuecell.config.manager import ConfigManager

config = ConfigManager()

# Get agent config
agent_cfg = config.get_agent_config("research_agent")
model_id = agent_cfg.get("model_id")

# Get provider config
provider_cfg = config.get_provider_config("openrouter")
api_key = provider_cfg.get("api_key")

# Get environment variable with fallback
api_key = config.get_env("OPENROUTER_API_KEY", "default_value")
```

---

## Common Patterns & Best Practices

### Error Handling

**Backend:**
```python
from loguru import logger
from valuecell.core.agent import streaming

try:
    result = await risky_operation()
    yield streaming.message_chunk(f"Success: {result}")
except Exception as e:
    logger.error(f"Operation failed: {e}")
    yield streaming.error(f"Error: {str(e)}")
    return
finally:
    yield streaming.done()
```

**Frontend:**
```typescript
import { toast } from "sonner";

try {
  const result = await apiCall();
  toast.success("Operation completed");
} catch (error) {
  toast.error(`Failed: ${error.message}`);
  console.error("API call failed:", error);
}
```

### Logging

**Backend (loguru):**
```python
from loguru import logger

logger.debug("Debug information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error occurred")
logger.exception("Exception with traceback")
```

Logs are written to `logs/{timestamp}/*.log`

**Frontend:**
```typescript
// Development only
console.log("Debug info");
console.warn("Warning");
console.error("Error");

// Production-safe (use toast)
import { toast } from "sonner";
toast.info("Information");
toast.error("Error message");
```

### Async Operations

**Always use async/await** for I/O operations:

```python
# Good
async def fetch_data():
    result = await api_call()
    return result

# Bad (blocking)
def fetch_data():
    result = requests.get(url)
    return result
```

### State Management (Frontend)

Use **Zustand** for global state:

```typescript
// store/myStore.ts
import { create } from 'zustand';

interface MyStore {
  count: number;
  increment: () => void;
}

export const useMyStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Component
const MyComponent = () => {
  const { count, increment } = useMyStore();
  return <button onClick={increment}>{count}</button>;
};
```

### API Communication

**Frontend to Backend:**
```typescript
// api/client.ts
export const apiClient = {
  async getAgents() {
    const response = await fetch('/api/v1/agents');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
};

// With TanStack Query
import { useQuery } from '@tanstack/react-query';

const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
  });
};
```

### Security Best Practices

1. **Never commit secrets**: Use `.env` file (gitignored)
2. **Validate user input**: Use Pydantic models
3. **Sanitize SQL**: Use SQLAlchemy ORM, never raw queries
4. **API keys**: Store in environment, never in code
5. **Trading operations**: Require explicit confirmation
6. **OKX trading**: Keep `OKX_ALLOW_LIVE_TRADING=false` until validated

### Performance Considerations

1. **Use async/await** for I/O operations
2. **Stream responses** instead of buffering
3. **Implement pagination** for large datasets
4. **Cache expensive computations** (e.g., LanceDB for embeddings)
5. **Lazy load** frontend components with React.lazy()

---

## Important Files & Locations

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (gitignored) |
| `.env.example` | Environment template |
| `python/configs/config.yaml` | Main application config |
| `python/configs/providers/*.yaml` | LLM provider configs |
| `python/configs/agents/*.yaml` | Agent configurations |
| `python/configs/agent_cards/*.json` | UI metadata for agents |

### Entry Points

| File | Purpose |
|------|---------|
| `start.sh` | Main launcher (macOS/Linux) |
| `start.ps1` | Main launcher (Windows) |
| `python/scripts/launch.py` | Backend launcher with agent selection |
| `python/valuecell/server/main.py` | FastAPI app entry point |
| `frontend/src/root.tsx` | React app entry point |

### Core Backend Files

| File | Purpose |
|------|---------|
| `python/valuecell/core/coordinate/orchestrator.py` | Main orchestrator |
| `python/valuecell/core/types.py` | Type definitions |
| `python/valuecell/config/manager.py` | Config management |
| `python/valuecell/server/api/router.py` | API routes |
| `python/valuecell/server/db/models.py` | Database models |

### Core Frontend Files

| File | Purpose |
|------|---------|
| `frontend/src/routes.ts` | Route definitions |
| `frontend/src/store/` | Zustand stores |
| `frontend/src/components/` | Reusable components |
| `frontend/src/api/` | API client |
| `frontend/vite.config.ts` | Vite configuration |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `docs/CONFIGURATION_GUIDE.md` | Configuration details |
| `docs/CORE_ARCHITECTURE.md` | Architecture deep dive |
| `docs/CONTRIBUTE_AN_AGENT.md` | Agent development guide |
| `docs/OKX_SETUP.md` | Trading setup |

---

## Testing Guidelines

### Python Tests

- **Location**: `python/valuecell/*/tests/`
- **Framework**: pytest
- **Naming**: `test_*.py`
- **Coverage**: Aim for >80% on new code

**Test structure:**
```python
import pytest
from valuecell.module import function

class TestFunction:
    """Test suite for function."""

    def test_normal_case(self):
        """Test normal operation."""
        result = function("input")
        assert result == "expected"

    def test_edge_case(self):
        """Test edge case."""
        with pytest.raises(ValueError):
            function(None)

    @pytest.mark.asyncio
    async def test_async_function(self):
        """Test async operation."""
        result = await async_function()
        assert result is not None
```

### Frontend Tests

- **Framework**: To be implemented (Bun test)
- **Location**: `frontend/src/**/*.test.tsx`

---

## Troubleshooting

### Common Issues

**1. Database incompatibility after update:**
```bash
# Solution: Reset database
rm -rf lancedb/ valuecell.db .knowledgebase/
cd python && uv run valuecell/server/db/init_db.py
```

**2. Missing dependencies:**
```bash
# Backend
cd python && uv sync

# Frontend
cd frontend && bun install
```

**3. Agent not starting:**
- Check logs in `logs/{timestamp}/`
- Verify agent config in `python/configs/agents/`
- Ensure API keys in `.env`

**4. Frontend build errors:**
```bash
cd frontend
rm -rf node_modules bun.lock
bun install
```

**5. Port already in use:**
```bash
# Check what's using port 8000 (backend)
lsof -i :8000
kill -9 <PID>

# Check what's using port 1420 (frontend)
lsof -i :1420
kill -9 <PID>
```

### Getting Help

- **Documentation**: `docs/` directory
- **Issues**: https://github.com/ValueCell-ai/valuecell/issues
- **Discord**: https://discord.com/invite/84Kex3GGAh
- **Core Architecture**: `docs/CORE_ARCHITECTURE.md`

---

## Quick Reference

### Common Commands

```bash
# Start everything
bash start.sh

# Backend only
cd python && uv run scripts/launch.py

# Frontend only
cd frontend && bun run dev

# Run specific agent
cd python && uv run -m valuecell.agents.research_agent

# Run tests
cd python && uv run pytest

# Format code
cd python && uv run ruff format .
cd frontend && bun run format:fix

# Lint code
cd python && uv run ruff check .
cd frontend && bun run lint
```

### Environment Variables (Key Ones)

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-xxx    # Or other LLM provider

# Optional
API_PORT=8000                       # Backend port
API_DEBUG=true                      # Debug mode
LANG=en-US                          # Language
TIMEZONE=America/New_York           # Timezone
AGENT_DEBUG_MODE=false              # Agent debug logs

# Trading
OKX_NETWORK=paper                   # paper/mainnet
OKX_ALLOW_LIVE_TRADING=false        # Safety flag
```

### Important URLs

- **Production Site**: http://localhost:1420
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health
- **GitHub**: https://github.com/ValueCell-ai/valuecell

---

## AI Assistant Tips

When working with this codebase as an AI assistant:

1. **Always check existing patterns** before creating new ones
2. **Read relevant docs** in `docs/` before major changes
3. **Follow the three-tier config system**: env vars → .env → YAML
4. **Test agent changes** with `uv run -m valuecell.agents.agent_name`
5. **Check logs** in `logs/{timestamp}/` for debugging
6. **Use type hints** extensively in Python
7. **Keep agents independent** - they run as separate processes
8. **Stream responses** - never buffer entire responses
9. **Handle errors gracefully** - financial apps need reliability
10. **Security first** - especially for trading operations

### Before Making Changes

1. Understand the current architecture (see `docs/CORE_ARCHITECTURE.md`)
2. Check if similar functionality exists
3. Review relevant agent implementations
4. Test locally before committing
5. Follow the style guides (Ruff for Python, Biome for TS)

### When Adding Features

1. Determine if it's an agent, API endpoint, or UI component
2. Follow established patterns in similar modules
3. Add configuration in appropriate YAML files
4. Update agent cards if adding UI elements
5. Test thoroughly with different LLM providers
6. Document in code and update relevant docs

---

**Last Updated**: 2025-11-17 by Claude (AI Assistant)

For the most current information, always check:
- `docs/CORE_ARCHITECTURE.md` for architecture
- `docs/CONTRIBUTE_AN_AGENT.md` for agent development
- `docs/CONFIGURATION_GUIDE.md` for configuration
- GitHub issues and pull requests for latest discussions
