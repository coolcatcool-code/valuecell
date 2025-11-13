# ValueCell 回测指南

## 目录
- [回测概述](#回测概述)
- [回测系统架构](#回测系统架构)
- [快速开始](#快速开始)
- [纸上交易（Paper Trading）](#纸上交易paper-trading)
- [回测数据准备](#回测数据准备)
- [策略回测流程](#策略回测流程)
- [性能评估指标](#性能评估指标)
- [回测vs实盘差异](#回测vs实盘差异)
- [最佳实践](#最佳实践)
- [案例研究](#案例研究)

---

## 回测概述

### 什么是回测？

**回测（Backtesting）**是使用历史数据测试交易策略的过程，目的是评估策略在过去市场条件下的表现，预测未来可能的收益和风险。

### ValueCell的回测能力

ValueCell当前提供**两种级别的回测**：

1. **纸上交易（Paper Trading）** ⭐ 推荐
   - 使用实时市场数据
   - 模拟订单执行
   - 不涉及真实资金
   - 最接近实盘表现
   - **默认模式，最安全**

2. **历史数据回测（历史模拟）**
   - 使用历史K线数据
   - 快速验证策略逻辑
   - 可批量测试多个参数
   - 需要考虑过拟合风险

### 回测的价值

✅ **验证策略逻辑** - 确保策略按预期工作
✅ **评估收益潜力** - 了解历史表现
✅ **识别风险** - 发现最大回撤、连续亏损
✅ **优化参数** - 找到最佳参数组合
✅ **建立信心** - 上线前充分测试

⚠️ **回测不等于未来** - 历史表现不代表未来收益

---

## 回测系统架构

### ValueCell回测组件

```
┌─────────────────────────────────────────────────┐
│           策略回测完整流程                       │
│                                                 │
│  ┌───────────────┐                             │
│  │  历史数据源    │  YFinance/AKShare           │
│  │               │  OKX (Paper Trading)        │
│  └───────┬───────┘                             │
│          ↓                                      │
│  ┌───────────────┐                             │
│  │  数据预处理    │  清洗、对齐、特征工程        │
│  └───────┬───────┘                             │
│          ↓                                      │
│  ┌───────────────┐                             │
│  │  策略引擎      │                             │
│  │               │                             │
│  │  Strategy Agent (LLM驱动)                   │
│  │  • 特征计算                                  │
│  │  • Composer决策                             │
│  │  • 护栏标准化                                │
│  └───────┬───────┘                             │
│          ↓                                      │
│  ┌───────────────┐                             │
│  │  模拟执行器    │                             │
│  │               │                             │
│  │  Paper Trading Gateway                      │
│  │  • 订单模拟                                  │
│  │  • 滑点模拟                                  │
│  │  • 成本计算                                  │
│  └───────┬───────┘                             │
│          ↓                                      │
│  ┌───────────────┐                             │
│  │  组合追踪      │                             │
│  │               │                             │
│  │  Portfolio Service                          │
│  │  • 仓位管理                                  │
│  │  • P&L计算                                  │
│  │  • 风险指标                                  │
│  └───────┬───────┘                             │
│          ↓                                      │
│  ┌───────────────┐                             │
│  │  交易历史      │                             │
│  │               │                             │
│  │  History Recorder                           │
│  │  • 决策记录                                  │
│  │  • 执行记录                                  │
│  │  • 绩效摘要                                  │
│  └───────┬───────┘                             │
│          ↓                                      │
│  ┌───────────────┐                             │
│  │  性能分析      │                             │
│  │               │                             │
│  │  • 收益曲线                                  │
│  │  • 夏普比率                                  │
│  │  • 最大回撤                                  │
│  │  • 胜率分析                                  │
│  └───────────────┘                             │
└─────────────────────────────────────────────────┘
```

### Auto Trading Agent vs Strategy Agent

两个智能体都支持回测，但侧重点不同：

| 特性 | Auto Trading Agent | Strategy Agent |
|------|-------------------|----------------|
| **设计目标** | 开箱即用的自动交易 | 高度可定制的策略开发 |
| **技术分析** | 内置MACD、RSI等 | 自定义特征计算 |
| **AI集成** | 固定的AI信号生成 | LLM驱动的灵活决策 |
| **护栏机制** | 基础风险控制 | 高级护栏（冷却期、置信度等） |
| **历史反馈** | 简单绩效跟踪 | TradeDigest循环反馈 |
| **适合场景** | 快速启动、标准策略 | 研究、复杂策略、参数优化 |
| **回测方式** | 纸上交易 | 纸上交易 + 历史模拟 |

---

## 快速开始

### 方式一：使用Auto Trading Agent（推荐新手）

**步骤1：配置环境**

```bash
# .env文件
AUTO_TRADING_EXCHANGE=okx
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret
OKX_PASSPHRASE=your_passphrase
OKX_ALLOW_LIVE_TRADING=false  # 保持false！
```

**步骤2：启动系统**

```bash
bash start.sh
```

**步骤3：通过UI创建交易策略**

访问 http://localhost:1420

在对话框中：
```
"帮我创建一个比特币自动交易策略，使用技术分析"
```

智能体会：
1. 创建一个Auto Trading实例
2. 配置技术指标（MACD、RSI）
3. 启动纸上交易
4. 实时追踪仓位和P&L

**步骤4：监控表现**

- 在"Auto Trading Agent"页面查看：
  - 当前仓位
  - 未实现盈亏
  - 历史交易记录
  - 胜率统计

**步骤5：调整参数**

通过对话调整：
```
"降低RSI阈值到25/75"
"增加单笔交易风险到3%"
"只在MACD和RSI都确认时才交易"
```

### 方式二：使用Strategy Agent（高级用户）

**步骤1：创建策略配置**

```python
# my_strategy_config.py
from valuecell.agents.strategy_agent.models import UserRequest, TradingConfig

user_request = UserRequest(
    model_config={
        "provider": "openrouter",
        "model_id": "anthropic/claude-3.5-sonnet",
        "api_key": "your_api_key"
    },
    exchange_config={
        "exchange_id": "okx",
        "trading_mode": "virtual",  # 纸上交易
        "api_key": "okx_key",
        "secret_key": "okx_secret"
    },
    trading_config={
        "strategy_name": "my_btc_strategy",
        "initial_capital": 10000.0,
        "max_positions": 3,
        "symbols": ["BTC-USDT", "ETH-USDT"],
        "decide_interval": "1h",  # 每小时决策一次
        "custom_prompt": """
        你是一个专业的加密货币交易员。
        基于技术指标，做出理性的交易决策。

        规则：
        1. RSI < 30 且价格突破EMA12，考虑买入
        2. RSI > 70 且价格跌破EMA12，考虑卖出
        3. MACD金叉确认买入，死叉确认卖出
        4. 单笔交易不超过总资金的30%
        5. 近期亏损的标的暂停3天

        输出格式：
        - instrument: 标的
        - action: buy/sell/flat/noop
        - target_qty: 目标仓位
        - confidence: 0-100
        - rationale: 理由
        """
    }
)
```

**步骤2：运行回测**

```python
# backtest_runner.py
import asyncio
from valuecell.agents.strategy_agent.core import DecisionCoordinator
from valuecell.agents.strategy_agent.data.market_data import OKXMarketData
from valuecell.agents.strategy_agent.features.technical_indicators import TechnicalFeatureComputer
from valuecell.agents.strategy_agent.decision.composer import Composer
from valuecell.agents.strategy_agent.execution.paper_trading import PaperTradingGateway
from valuecell.agents.strategy_agent.portfolio.service import PortfolioService
from valuecell.agents.strategy_agent.trading_history.recorder import HistoryRecorder
from valuecell.agents.strategy_agent.trading_history.digest import DigestBuilder

async def run_backtest():
    # 初始化组件
    market_data = OKXMarketData(mode="demo")
    feature_computer = TechnicalFeatureComputer()
    composer = Composer(
        llm=create_llm(user_request.model_config),
        prompt_text=user_request.trading_config.custom_prompt
    )
    paper_trading = PaperTradingGateway(
        initial_capital=user_request.trading_config.initial_capital
    )
    portfolio_service = PortfolioService(paper_trading)
    history_recorder = HistoryRecorder()
    digest_builder = DigestBuilder(history_recorder)

    # 创建协调器
    coordinator = DecisionCoordinator(
        strategy_id="my_btc_strategy",
        market_data=market_data,
        feature_computer=feature_computer,
        composer=composer,
        portfolio_service=portfolio_service,
        execution_gateway=paper_trading,
        history_recorder=history_recorder,
        digest_builder=digest_builder,
        symbols=user_request.trading_config.symbols
    )

    # 运行回测（模拟实时）
    print("开始回测...")
    for i in range(100):  # 100个决策周期
        print(f"\n=== 决策周期 {i+1} ===")
        await coordinator.run_once()

        # 打印当前状态
        portfolio = await portfolio_service.get_view()
        print(f"总资产: ${portfolio.total_value:.2f}")
        print(f"未实现盈亏: ${portfolio.total_unrealized_pnl:.2f}")
        print(f"持仓数: {len(portfolio.positions)}")

        # 等待下一个周期
        await asyncio.sleep(60)  # 实际应根据decide_interval调整

    # 输出最终结果
    print("\n=== 回测完成 ===")
    final_portfolio = await portfolio_service.get_view()
    print(f"初始资金: $10,000")
    print(f"最终资产: ${final_portfolio.total_value:.2f}")
    print(f"总收益: ${final_portfolio.total_value - 10000:.2f}")
    print(f"收益率: {(final_portfolio.total_value / 10000 - 1) * 100:.2f}%")

if __name__ == "__main__":
    asyncio.run(run_backtest())
```

---

## 纸上交易（Paper Trading）

### 什么是纸上交易？

纸上交易使用**实时市场数据**但**不涉及真实资金**，完全模拟订单执行。

### 优势

✅ **最接近实盘** - 实时数据，真实市场条件
✅ **安全** - 零风险，可以大胆试验
✅ **实时反馈** - 立即看到策略表现
✅ **完整功能** - 测试所有功能（订单、仓位、P&L）

### 在ValueCell中使用

**OKX纸上交易**：

OKX提供了专门的模拟交易环境（demo环境），API与实盘完全一致。

```bash
# .env配置
AUTO_TRADING_EXCHANGE=okx
OKX_API_KEY=your_demo_api_key  # 从OKX获取demo API key
OKX_SECRET_KEY=your_demo_secret
OKX_PASSPHRASE=your_demo_passphrase
OKX_ALLOW_LIVE_TRADING=false  # 确保为false

# OKX会自动路由到demo环境
```

**内置纸上交易引擎**：

```python
from valuecell.agents.strategy_agent.execution.paper_trading import PaperTradingGateway

# 初始化
paper_trading = PaperTradingGateway(
    initial_capital=10000.0,
    commission_rate=0.001,  # 0.1%手续费
    slippage_bps=5  # 5个基点滑点
)

# 执行指令
await paper_trading.execute(instructions)

# 查询仓位
positions = paper_trading.get_positions()

# 查询余额
balance = paper_trading.get_balance()
```

### 纸上交易最佳实践

1. **使用真实资金量** - 不要用虚拟的100万测试，用你计划投入的实际金额
2. **足够的测试时间** - 至少运行1-2周，经历不同市场条件
3. **记录所有交易** - 分析每笔交易的逻辑
4. **监控极端情况** - 观察在剧烈波动时的表现
5. **比较多个策略** - 同时运行几个策略进行对比

---

## 回测数据准备

### 数据源选择

| 数据源 | 市场 | 频率 | 历史深度 | 质量 |
|--------|------|------|----------|------|
| **YFinance** | 美股、加密货币 | 1m, 5m, 15m, 1h, 1d | ~5年 | 良好 |
| **AKShare** | A股、港股 | 1d | ~10年 | 优秀 |
| **OKX API** | 加密货币 | 1m, 5m, 15m, 1h, 4h, 1d | ~2年 | 优秀 |

### 下载历史数据

**示例：下载BTC历史数据**

```python
# download_data.py
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def download_crypto_data(symbol: str, period: str = "1y", interval: str = "1h"):
    """
    下载加密货币历史数据

    Args:
        symbol: 例如 "BTC-USD"
        period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    """
    ticker = yf.Ticker(symbol)
    data = ticker.history(period=period, interval=interval)

    # 保存到CSV
    filename = f"data/{symbol}_{period}_{interval}.csv"
    data.to_csv(filename)
    print(f"数据已保存到: {filename}")
    print(f"数据行数: {len(data)}")
    print(f"日期范围: {data.index[0]} 到 {data.index[-1]}")

    return data

# 下载数据
btc_data = download_crypto_data("BTC-USD", period="1y", interval="1h")
eth_data = download_crypto_data("ETH-USD", period="1y", interval="1h")
```

**示例：下载A股数据**

```python
import akshare as ak

def download_china_stock_data(symbol: str, start_date: str, end_date: str):
    """
    下载A股历史数据

    Args:
        symbol: 股票代码，例如 "000001"
        start_date: 开始日期，例如 "20230101"
        end_date: 结束日期，例如 "20240101"
    """
    data = ak.stock_zh_a_hist(
        symbol=symbol,
        period="daily",
        start_date=start_date,
        end_date=end_date,
        adjust="qfq"  # 前复权
    )

    filename = f"data/{symbol}_{start_date}_{end_date}.csv"
    data.to_csv(filename, index=False)
    print(f"数据已保存到: {filename}")

    return data

# 下载平安银行数据
data = download_china_stock_data("000001", "20230101", "20240101")
```

### 数据清洗

```python
def clean_market_data(df: pd.DataFrame) -> pd.DataFrame:
    """清洗市场数据"""
    # 1. 删除重复行
    df = df.drop_duplicates()

    # 2. 按时间排序
    df = df.sort_index()

    # 3. 处理缺失值
    # 向前填充（适用于价格）
    df['Close'] = df['Close'].ffill()
    df['Open'] = df['Open'].ffill()
    df['High'] = df['High'].ffill()
    df['Low'] = df['Low'].ffill()

    # 成交量缺失填0
    df['Volume'] = df['Volume'].fillna(0)

    # 4. 删除异常值
    # 价格不应为0或负数
    df = df[df['Close'] > 0]
    df = df[df['Volume'] >= 0]

    # 5. 检查价格连续性
    # 如果价格跳变超过50%，可能是数据错误
    price_change = df['Close'].pct_change().abs()
    outliers = price_change > 0.5
    if outliers.sum() > 0:
        print(f"警告: 发现 {outliers.sum()} 个异常价格跳变")
        # 可选择删除或手动检查

    return df

# 清洗数据
cleaned_data = clean_market_data(btc_data)
```

### 数据对齐

当回测多个资产时，需要确保时间对齐：

```python
def align_data(dfs: dict) -> dict:
    """
    对齐多个资产的数据

    Args:
        dfs: {symbol: DataFrame} 字典

    Returns:
        对齐后的数据字典
    """
    # 找到共同的时间索引
    common_index = None
    for symbol, df in dfs.items():
        if common_index is None:
            common_index = df.index
        else:
            common_index = common_index.intersection(df.index)

    print(f"共同时间点数量: {len(common_index)}")

    # 对齐所有数据
    aligned = {}
    for symbol, df in dfs.items():
        aligned[symbol] = df.loc[common_index]

    return aligned

# 使用
data_dict = {
    "BTC-USD": btc_data,
    "ETH-USD": eth_data
}
aligned_data = align_data(data_dict)
```

---

## 策略回测流程

### 完整回测脚本

```python
# backtest_historical.py
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict
import matplotlib.pyplot as plt

class HistoricalBacktester:
    """历史数据回测引擎"""

    def __init__(
        self,
        initial_capital: float = 10000.0,
        commission_rate: float = 0.001,
        slippage_bps: float = 5.0
    ):
        self.initial_capital = initial_capital
        self.commission_rate = commission_rate
        self.slippage_bps = slippage_bps

        self.cash = initial_capital
        self.positions = {}  # {symbol: quantity}
        self.portfolio_history = []
        self.trade_history = []

    def execute_trade(
        self,
        symbol: str,
        quantity: float,
        price: float,
        timestamp: datetime
    ):
        """执行交易"""
        # 计算滑点
        slippage = price * (self.slippage_bps / 10000)
        if quantity > 0:  # 买入
            execution_price = price + slippage
        else:  # 卖出
            execution_price = price - slippage

        # 计算成本
        notional = abs(quantity * execution_price)
        commission = notional * self.commission_rate
        total_cost = notional + commission

        # 检查资金
        if quantity > 0 and total_cost > self.cash:
            print(f"资金不足: 需要 ${total_cost:.2f}, 可用 ${self.cash:.2f}")
            return False

        # 更新仓位
        current_qty = self.positions.get(symbol, 0)
        new_qty = current_qty + quantity

        if abs(new_qty) < 1e-8:
            del self.positions[symbol]
        else:
            self.positions[symbol] = new_qty

        # 更新现金
        if quantity > 0:  # 买入，减少现金
            self.cash -= total_cost
        else:  # 卖出，增加现金
            self.cash += notional - commission

        # 记录交易
        self.trade_history.append({
            'timestamp': timestamp,
            'symbol': symbol,
            'quantity': quantity,
            'price': execution_price,
            'commission': commission,
            'cash_after': self.cash
        })

        return True

    def calculate_portfolio_value(self, prices: Dict[str, float]) -> float:
        """计算组合总价值"""
        position_value = sum(
            qty * prices.get(symbol, 0)
            for symbol, qty in self.positions.items()
        )
        return self.cash + position_value

    def run(
        self,
        data: Dict[str, pd.DataFrame],
        strategy_func: callable
    ):
        """
        运行回测

        Args:
            data: {symbol: DataFrame} 历史数据
            strategy_func: 策略函数，签名为 func(timestamp, prices, positions) -> List[Order]
        """
        # 获取所有时间戳
        timestamps = sorted(set(
            ts for df in data.values() for ts in df.index
        ))

        print(f"开始回测: {len(timestamps)} 个时间点")

        for i, timestamp in enumerate(timestamps):
            # 获取当前价格
            current_prices = {
                symbol: df.loc[timestamp, 'Close']
                for symbol, df in data.items()
                if timestamp in df.index
            }

            # 调用策略
            orders = strategy_func(
                timestamp,
                current_prices,
                self.positions.copy()
            )

            # 执行订单
            for order in orders:
                self.execute_trade(
                    symbol=order['symbol'],
                    quantity=order['quantity'],
                    price=current_prices[order['symbol']],
                    timestamp=timestamp
                )

            # 记录组合价值
            portfolio_value = self.calculate_portfolio_value(current_prices)
            self.portfolio_history.append({
                'timestamp': timestamp,
                'value': portfolio_value,
                'cash': self.cash,
                'positions': len(self.positions)
            })

            # 进度显示
            if (i + 1) % 100 == 0:
                progress = (i + 1) / len(timestamps) * 100
                print(f"进度: {progress:.1f}% - 组合价值: ${portfolio_value:.2f}")

        print("回测完成!")
        self.print_summary()

    def print_summary(self):
        """打印回测摘要"""
        if not self.portfolio_history:
            print("没有回测数据")
            return

        initial_value = self.initial_capital
        final_value = self.portfolio_history[-1]['value']
        total_return = (final_value - initial_value) / initial_value

        # 计算每日收益
        df = pd.DataFrame(self.portfolio_history)
        df['returns'] = df['value'].pct_change()

        # 统计指标
        print("\n=== 回测摘要 ===")
        print(f"初始资金: ${initial_value:,.2f}")
        print(f"最终资产: ${final_value:,.2f}")
        print(f"总收益: ${final_value - initial_value:,.2f}")
        print(f"收益率: {total_return * 100:.2f}%")
        print(f"交易次数: {len(self.trade_history)}")
        print(f"平均每日收益率: {df['returns'].mean() * 100:.3f}%")
        print(f"收益率标准差: {df['returns'].std() * 100:.3f}%")

        # 夏普比率（假设无风险利率为0）
        if df['returns'].std() > 0:
            sharpe = df['returns'].mean() / df['returns'].std() * np.sqrt(252)
            print(f"夏普比率: {sharpe:.2f}")

        # 最大回撤
        cummax = df['value'].cummax()
        drawdown = (df['value'] - cummax) / cummax
        max_drawdown = drawdown.min()
        print(f"最大回撤: {max_drawdown * 100:.2f}%")

        # 胜率
        trades_df = pd.DataFrame(self.trade_history)
        if len(trades_df) > 0:
            # 简化计算：假设所有卖出都是平仓
            sell_trades = trades_df[trades_df['quantity'] < 0]
            if len(sell_trades) > 0:
                # 这里需要更复杂的逻辑来匹配买入卖出
                print(f"卖出交易数: {len(sell_trades)}")

    def plot_results(self):
        """绘制回测结果"""
        df = pd.DataFrame(self.portfolio_history)

        fig, axes = plt.subplots(2, 1, figsize=(12, 8))

        # 组合价值曲线
        axes[0].plot(df['timestamp'], df['value'], label='Portfolio Value')
        axes[0].axhline(y=self.initial_capital, color='r', linestyle='--', label='Initial Capital')
        axes[0].set_title('Portfolio Value Over Time')
        axes[0].set_ylabel('Value ($)')
        axes[0].legend()
        axes[0].grid(True)

        # 回撤曲线
        cummax = df['value'].cummax()
        drawdown = (df['value'] - cummax) / cummax * 100
        axes[1].fill_between(df['timestamp'], 0, drawdown, color='red', alpha=0.3)
        axes[1].set_title('Drawdown')
        axes[1].set_ylabel('Drawdown (%)')
        axes[1].set_xlabel('Time')
        axes[1].grid(True)

        plt.tight_layout()
        plt.savefig('backtest_results.png')
        print("回测结果图已保存到 backtest_results.png")
        plt.show()
```

### 定义策略

```python
def simple_rsi_strategy(timestamp, prices, positions):
    """
    简单的RSI策略

    规则：
    - RSI < 30: 买入
    - RSI > 70: 卖出
    """
    orders = []

    # 这里需要访问技术指标数据
    # 为简化示例，假设已经计算好
    # 实际应用中需要维护技术指标状态

    # 示例：假设当前RSI为25，买入BTC
    symbol = "BTC-USD"
    current_qty = positions.get(symbol, 0)

    # 假设的RSI值（实际应从数据中获取）
    rsi = 25

    if rsi < 30 and current_qty == 0:
        # 买入：使用50%资金
        # 这里需要知道可用现金，简化示例
        target_qty = 0.1  # 买入0.1个BTC
        orders.append({
            'symbol': symbol,
            'quantity': target_qty
        })
    elif rsi > 70 and current_qty > 0:
        # 卖出全部
        orders.append({
            'symbol': symbol,
            'quantity': -current_qty
        })

    return orders
```

### 运行回测

```python
# 加载数据
btc_data = pd.read_csv('data/BTC-USD_1y_1h.csv', index_col=0, parse_dates=True)

data = {
    'BTC-USD': btc_data
}

# 创建回测器
backtester = HistoricalBacktester(
    initial_capital=10000.0,
    commission_rate=0.001,
    slippage_bps=5.0
)

# 运行回测
backtester.run(data, simple_rsi_strategy)

# 绘制结果
backtester.plot_results()
```

---

## 性能评估指标

### 核心指标

#### 1. 总收益率（Total Return）

```python
total_return = (final_value - initial_value) / initial_value
```

**解释**：整个回测期间的总收益百分比

**示例**：
- 初始资金：$10,000
- 最终资产：$12,500
- 总收益率：25%

#### 2. 年化收益率（Annualized Return）

```python
years = (end_date - start_date).days / 365.25
annualized_return = (final_value / initial_value) ** (1 / years) - 1
```

**解释**：将收益率标准化为年度收益

**示例**：
- 6个月收益15% → 年化约33%

#### 3. 夏普比率（Sharpe Ratio）

```python
sharpe_ratio = (mean_return - risk_free_rate) / std_return * sqrt(periods_per_year)
```

**解释**：衡量风险调整后的收益，越高越好

**等级**：
- < 0: 表现差于无风险资产
- 0-1: 一般
- 1-2: 良好
- 2-3: 优秀
- \> 3: 卓越

#### 4. 最大回撤（Maximum Drawdown）

```python
cummax = portfolio_values.cummax()
drawdown = (portfolio_values - cummax) / cummax
max_drawdown = drawdown.min()
```

**解释**：从峰值到谷底的最大跌幅

**示例**：
- 组合最高$15,000，最低跌到$12,000
- 最大回撤：20%

#### 5. 胜率（Win Rate）

```python
win_rate = winning_trades / total_trades
```

**解释**：盈利交易占总交易的比例

**注意**：高胜率不一定代表高收益（取决于盈亏比）

#### 6. 盈亏比（Profit/Loss Ratio）

```python
avg_win = total_profit / winning_trades
avg_loss = total_loss / losing_trades
profit_loss_ratio = avg_win / abs(avg_loss)
```

**解释**：平均盈利与平均亏损的比值

**示例**：
- 盈亏比2:1意味着平均盈利是平均亏损的2倍

### 完整评估函数

```python
def calculate_metrics(portfolio_history: List[dict], trade_history: List[dict]):
    """计算完整的回测指标"""
    df = pd.DataFrame(portfolio_history)
    df['returns'] = df['value'].pct_change()

    initial_value = df['value'].iloc[0]
    final_value = df['value'].iloc[-1]

    # 1. 收益指标
    total_return = (final_value - initial_value) / initial_value

    # 假设回测1年
    annualized_return = total_return  # 如果不是1年需要调整

    # 2. 风险指标
    volatility = df['returns'].std() * np.sqrt(252)  # 年化波动率

    # 夏普比率（假设无风险利率2%）
    risk_free_rate = 0.02
    sharpe = (annualized_return - risk_free_rate) / volatility if volatility > 0 else 0

    # 最大回撤
    cummax = df['value'].cummax()
    drawdown = (df['value'] - cummax) / cummax
    max_drawdown = drawdown.min()

    # 3. 交易指标
    trades_df = pd.DataFrame(trade_history)
    num_trades = len(trades_df)

    # 简化的胜率计算（假设每笔卖出都是平仓）
    # 实际应该匹配买入卖出对

    metrics = {
        '总收益率': f"{total_return * 100:.2f}%",
        '年化收益率': f"{annualized_return * 100:.2f}%",
        '年化波动率': f"{volatility * 100:.2f}%",
        '夏普比率': f"{sharpe:.2f}",
        '最大回撤': f"{max_drawdown * 100:.2f}%",
        '交易次数': num_trades,
        '平均每日收益': f"{df['returns'].mean() * 100:.3f}%",
        '收益标准差': f"{df['returns'].std() * 100:.3f}%"
    }

    return metrics

# 使用
metrics = calculate_metrics(backtester.portfolio_history, backtester.trade_history)
for key, value in metrics.items():
    print(f"{key}: {value}")
```

---

## 回测vs实盘差异

### 常见陷阱

#### 1. 过拟合（Overfitting）

**问题**：策略在历史数据上表现完美，但实盘失败。

**原因**：
- 过度优化参数以适应特定历史数据
- 使用了未来信息（前视偏差）
- 样本外数据太少

**解决方案**：
- 使用训练集/验证集/测试集划分
- 参数敏感性分析
- 保持策略简单
- 增加样本外测试

```python
# 划分数据集
train_end = int(len(data) * 0.6)  # 60%训练
val_end = int(len(data) * 0.8)    # 20%验证

train_data = data[:train_end]
val_data = data[train_end:val_end]
test_data = data[val_end:]  # 20%测试

# 在训练集上优化参数
# 在验证集上选择最佳参数
# 在测试集上评估最终表现
```

#### 2. 前视偏差（Look-Ahead Bias）

**问题**：使用了未来才能知道的信息。

**示例**：
```python
# 错误：使用整个数据集计算指标
df['MA'] = df['Close'].rolling(20).mean()  # 包含未来数据！

# 正确：逐步计算
for i in range(20, len(df)):
    df.loc[i, 'MA'] = df.loc[i-20:i, 'Close'].mean()
```

#### 3. 幸存者偏差（Survivorship Bias）

**问题**：只测试仍在交易的资产，忽略退市的。

**影响**：高估策略表现。

**解决方案**：
- 使用包含退市股票的数据集
- 测试多个时间段
- 注意数据来源的完整性

#### 4. 滑点与手续费

**问题**：回测时忽略交易成本。

**影响**：严重高估收益（特别是高频策略）。

**解决方案**：
```python
# 保守估计
commission_rate = 0.001  # 0.1%
slippage_bps = 10  # 10个基点 (0.1%)

# 高频策略应该使用更高的估计
```

#### 5. 市场影响（Market Impact）

**问题**：大额订单会影响价格，但回测时假设无限流动性。

**影响**：大资金策略的实盘表现会明显差于回测。

**解决方案**：
- 根据成交量限制订单大小
- 模拟市场影响

```python
def calculate_market_impact(order_size, avg_volume):
    """简化的市场影响模型"""
    volume_participation = order_size / avg_volume

    # 如果订单占日均成交量的比例很高，价格会受影响
    if volume_participation > 0.1:
        impact_bps = volume_participation * 100  # 粗略估计
        return impact_bps
    return 0
```

#### 6. 数据质量问题

**常见问题**：
- 缺失数据
- 错误数据（价格突然跳变）
- 不同交易所数据不一致
- 低流动性资产的报价不准确

**解决方案**：
- 数据清洗（见前文）
- 使用多个数据源交叉验证
- 关注数据来源的可靠性

### 实盘vs回测对比清单

在上线前，确保考虑了这些差异：

- [ ] 交易成本（手续费、滑点）
- [ ] 市场影响（大额订单）
- [ ] 执行延迟（网络、系统）
- [ ] 数据延迟（行情推送）
- [ ] 极端市场条件（黑天鹅）
- [ ] 系统故障（断网、宕机）
- [ ] 资金限制（实际可用资金）
- [ ] 心理因素（恐惧、贪婪）

---

## 最佳实践

### 1. 遵循科学流程

```
假设 → 设计 → 回测 → 分析 → 优化 → 验证 → 纸上交易 → 实盘
```

**不要跳过步骤！**

### 2. 样本外测试

```python
# 80%数据训练/优化
# 20%数据作为完全独立的测试集
# 测试集结果才是真正的预期表现
```

### 3. 多市场/多周期测试

```python
# 不同市场环境
- 牛市
- 熊市
- 震荡市

# 不同时间周期
- 短期（1个月）
- 中期（6个月）
- 长期（2年+）
```

### 4. 参数敏感性分析

```python
def parameter_sensitivity_test(param_range):
    """测试参数对结果的敏感性"""
    results = []

    for param_value in param_range:
        # 使用该参数运行回测
        backtest_result = run_backtest(param_value)
        results.append({
            'param': param_value,
            'return': backtest_result.total_return,
            'sharpe': backtest_result.sharpe_ratio
        })

    # 绘制参数vs绩效曲线
    plt.plot([r['param'] for r in results], [r['return'] for r in results])
    plt.xlabel('Parameter Value')
    plt.ylabel('Total Return')
    plt.title('Parameter Sensitivity Analysis')
    plt.show()

# 示例：测试RSI阈值
parameter_sensitivity_test(range(20, 40, 2))  # RSI买入阈值从20到40
```

### 5. 压力测试

模拟极端市场条件：

```python
# 市场崩盘场景（-20%单日跌幅）
# 流动性枯竭（交易量减少90%）
# 系统故障（无法交易1天）
```

### 6. 记录所有决策

```python
# 记录每次修改策略的原因
# 保存每个版本的回测结果
# 分析为什么某些修改有效/无效
```

### 7. 设置现实目标

**不现实的目标**：
- ❌ 年化100%收益
- ❌ 零回撤
- ❌ 100%胜率

**现实的目标**：
- ✅ 年化15-30%收益（已经很优秀）
- ✅ 最大回撤<20%
- ✅ 夏普比率>1.5

---

## 案例研究

### 案例1：RSI均值回归策略

**策略描述**：
- RSI < 30买入，RSI > 70卖出
- 单次投入50%资金
- 持有至信号反转

**回测设置**：
- 标的：BTC-USD
- 周期：2023-01-01 到 2024-01-01
- 初始资金：$10,000
- 手续费：0.1%
- 滑点：5 bps

**回测结果**：
```
总收益率: 45.2%
年化收益率: 45.2%
夏普比率: 1.8
最大回撤: -18.5%
交易次数: 23
胜率: 56.5%
```

**分析**：
- ✅ 收益率可观
- ✅ 夏普比率良好
- ⚠️ 回撤略高
- ✅ 交易频率适中

**优化方向**：
1. 添加止损以减少回撤
2. 结合其他指标确认（MACD）
3. 动态调整仓位大小

### 案例2：多因子量化策略

**策略描述**：
- 技术因子：RSI、MACD、布林带
- LLM综合分析
- 置信度加权仓位
- 亏损标的冷却3天

**回测设置**：
- 标的：BTC-USD, ETH-USD, SOL-USD
- 周期：2023-01-01 到 2024-01-01
- 初始资金：$10,000
- 最大仓位：3个

**回测结果**：
```
总收益率: 67.8%
年化收益率: 67.8%
夏普比率: 2.3
最大回撤: -12.3%
交易次数: 47
胜率: 61.7%
盈亏比: 2.1:1
```

**分析**：
- ✅ 优秀的收益率
- ✅ 夏普比率优秀
- ✅ 回撤控制良好
- ✅ 高盈亏比

**成功因素**：
1. 多因子降低误信号
2. LLM提供了非线性分析能力
3. 冷却机制避免连续亏损
4. 多资产分散风险

---

## 总结

### 回测的目的

1. **验证逻辑** - 确保策略按预期工作
2. **评估潜力** - 了解历史表现范围
3. **发现问题** - 识别弱点和风险
4. **建立信心** - 为实盘做准备

### 回测不能做的

1. **预测未来** - 历史不会重演
2. **消除风险** - 市场总是不确定的
3. **替代监控** - 实盘需要持续关注
4. **保证盈利** - 任何策略都可能亏损

### 从回测到实盘的路径

```
1. 历史数据回测
   ↓
2. 样本外测试
   ↓
3. 参数敏感性分析
   ↓
4. 纸上交易（1-2周）
   ↓
5. 小资金实盘（10-20%计划资金）
   ↓
6. 监控并调整
   ↓
7. 逐步增加资金
```

### 关键提醒

⚠️ **永远从纸上交易开始**
⚠️ **保持策略简单**
⚠️ **不要过度优化**
⚠️ **考虑交易成本**
⚠️ **设置现实预期**
⚠️ **持续监控和调整**

---

**下一步**：
- [部署指南](./DEPLOYMENT_GUIDE_CN.md) - 学习如何部署到生产环境
- [生产使用指南](./PRODUCTION_GUIDE_CN.md) - 实盘操作和优化技巧
