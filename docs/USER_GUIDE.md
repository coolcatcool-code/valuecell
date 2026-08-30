# ValueCell User Guide

> This is the manual for people **actually using** ValueCell — not an
> architecture doc, not a deployment checklist, just "what do I do once
> the app is open." If you haven't deployed it yet, start with the
> [Deployment Guide](./DEPLOYMENT_GUIDE_CN.md) or
> [Release Notes](./RELEASE_CN.md) (currently Chinese-only; an English
> deployment doc is on the list — see the note at the bottom).

---

## Table of Contents

1. [What ValueCell Is](#what-valuecell-is)
2. [Before You Start](#before-you-start)
3. [Interface Tour](#interface-tour)
4. [Core Use 1: Just Talk to It](#core-use-1-just-talk-to-it)
5. [Core Use 2: Managing Your Watchlist](#core-use-2-managing-your-watchlist)
6. [Core Use 3: Deep Research](#core-use-3-deep-research-research-agent)
7. [Core Use 4: Auto Trading](#core-use-4-auto-trading-auto-trading-agent)
8. [Core Use 5: News](#core-use-5-news-news-agent)
9. [Core Use 6: Agent Market](#core-use-6-agent-market)
10. [Settings](#settings)
11. [FAQ](#faq)
12. [Risk Disclaimer](#risk-disclaimer)
13. [Getting Help](#getting-help)

---

## What ValueCell Is

One sentence: **talk to an AI investment advisor that never sleeps, and
let it research, track, and even trade for you.**

Open ValueCell and you're not looking at a dashboard full of buttons and
forms — you're looking at a text box. Everything you'd want to do —
look up a company's filings, track a stock, set up an automated trading
strategy, subscribe to news — happens by **typing it**, not by hunting
through menus. This guide walks through what to actually type for each
kind of thing, and what happens after.

---

## Before You Start

- Confirm the app is running: open `http://localhost:1420` in your
  browser (the default address if you deployed via Docker per the
  [Deployment Guide](./DEPLOYMENT_GUIDE_CN.md))
- Confirm `.env` has at least one LLM provider key set — without one,
  the backend exits immediately on startup with a clear error (this is
  a deliberate safeguard, not a random crash; see
  [RELEASE_CN.md](./RELEASE_CN.md))
- On first open you'll see a nearly empty welcome screen: a gently
  breathing brand mark in the center, a greeting, and three suggestion
  cards below (Deep Research / Auto Trading / Pushing News). That's the
  entire starting state — no dashboard, no setup wizard. Just start
  typing.

---

## Interface Tour

### The Top Bar

A thin strip across the very top of the screen. Left to right:

- **Left**: the ValueCell mark and name — click to return home
- **Four icons on the right**:
  - **Bar-chart icon** → opens the [Agent Market](#core-use-6-agent-market)
  - **Speech-bubble icon** → opens your conversation history in a side
    drawer (jump back into any past conversation, or delete one)
  - **Gear icon** → opens [Settings](#settings)
  - **⌘ K** (`Cmd+K` on Mac, `Ctrl+K` on Windows/Linux) → opens the
    command palette

The top bar is the **only** fixed navigation in this product — there's
no sidebar, no second-level menu underneath it.

### The Command Palette (⌘K)

Press `Cmd/Ctrl + K` from anywhere and a centered search box appears,
grouped into three sections:

- **Recent**: your recent conversations — click one to jump straight
  back in
- **Summon an advisor**: every currently enabled agent — click one to
  start talking to it immediately
- **Jump to**: shortcuts to the conversation home, Agent Market,
  Settings, and Memory

Typing filters all three groups live — type `market` and only "Agent
Market" survives. Along with the home-screen input box, this is the
other place you'll reach for constantly.

### Home

The main conversation area sits on the left, your **Watchlist** on the
right. The first time you use it, the main area is just the greeting
and the input box; once you've had a conversation, it turns into a feed
of task cards summarizing recent agent activity, with a persistent
input bar pinned at the bottom so you can keep asking things.

### Stock Detail Page

Click any stock in your watchlist to open its detail view: current
price, a 60-day chart, sector, and a company summary. A **Remove**
button at the top takes it off your watchlist.

---

## Core Use 1: Just Talk to It

The home input box talks to **ValueCell Agent** by default — the
super-agent that sits at the center of the whole system. You don't need
to figure out which specialist agent should handle your question first;
just type it, and ValueCell decides:

- Simple questions (e.g. "what's Apple trading at") get answered
  directly
- Complex requests (e.g. "research whether Tesla is worth buying, and
  if it looks good, set up auto trading for it") get broken into steps,
  routed to the right specialist agents, and the results come back to
  you as one conversation

**Example prompts** (these aren't made up — they're the app's own
built-in examples):

- "Setup trading with $100,000 for BTC-USD and ETH-USD using DeepSeek, Grok, Claude model"
- "What was Apple's revenue in Q4 2024? Provide the filing source."
- "What's the latest news about artificial intelligence?"

Responses stream in — text appears word by word, and a small dot in
front of each AI message breathes gently while it's working. If it
calls a tool (say, pulling a filing), you'll see an expandable "here's
what I'm doing" trace instead of a black-box answer appearing out of
nowhere.

**Following up**: keep typing in the same conversation and context
carries over. To start a new topic, just go back to Home and type — no
"new conversation" button needed.

---

## Core Use 2: Managing Your Watchlist

The **My Watchlist** panel on the right:

- **Add**: click **Add Stocks** at the bottom, search by company name
  or ticker, and click **Watchlist** next to a result to add it (an
  already-added stock shows **Watched** and the button greys out)
- **View**: click any stock in the list to open its detail page
- **Remove**: click **Remove** on the detail page

Or skip the clicking entirely — just say "add NVIDIA to my watchlist"
in the chat box. Same result. That's the whole design principle here:
**anything you can click, you can also just say.**

---

## Core Use 3: Deep Research (Research Agent)

The specialist for reading filings and pulling company information.
What it does (again, straight from the app's own example prompts):

- **Extract financial figures with a cited source**: "What was Apple's revenue in Q4 2024? Provide the filing source."
- **Analyze institutional holdings (13F filings)**: "What are the top holdings of Berkshire Hathaway in the latest 13F filing?"
- **Synthesize analysis with citations**: "Summarize analyst commentary on Apple's guidance and cite sources."
- **Monitor new filings**: track a company's latest SEC documents (10-K
  annual reports, 10-Q quarterly reports, 8-K material events, 13F
  institutional holdings)

Its answers **cite where the data came from** — which filing, which
section — rather than being a summary conjured from nowhere. That's the
main thing that separates it from a generic chatbot. The first time you
talk to it you'll see "Welcome to Research Agent!" — just start typing
underneath.

---

## Core Use 4: Auto Trading (Auto Trading Agent)

Handles technical analysis and automated trading for crypto. **Setup is
entirely conversational** — there's no form with fields to fill in.
Just tell it what you want:

```
Setup trading with $100,000 for BTC-USD and ETH-USD using DeepSeek, Grok, Claude model
```

```
Configure auto trader with $50,000 capital, trade BTC-USD, ETH-USD, SOL-USD with 1.5% risk
```

```
Setup trading agent with default settings for Bitcoin
```

**Default risk parameters** (used unless you specify otherwise):

| Parameter | Default |
|---|---|
| Risk per trade | 2% of capital |
| Max simultaneous positions | 3 |
| Check interval | 60 seconds |

**Technical indicators used**: MACD (12/26/9), RSI (14), EMA
(12/26/50), Bollinger Bands (20, 2σ) — the AI weighs these signals to
make a buy/sell call, and explains its confidence and reasoning.

**What you need to know about risk, stated plainly**:

- It runs in **paper trading** mode by default — no real money is ever
  touched
- Connecting a real exchange (OKX is currently supported) requires
  setting `AUTO_TRADING_EXCHANGE=okx` plus the matching API credentials
  in `.env` at deploy time
- Even with exchange credentials configured, `OKX_ALLOW_LIVE_TRADING`
  defaults to `false` and must be flipped to `true` by hand before any
  real trade executes — two independent, explicit switches, by design,
  so nothing goes live by accident
- **Strongly recommended**: run paper trading for at least one to two
  weeks and watch whether its decisions actually match your
  expectations before even considering going live, and start with a
  small amount when you do

Once it's running, just ask it things like "how are my positions doing"
or "why did you buy that" — it answers in the same conversation, no
separate reporting dashboard required.

---

## Core Use 5: News (News Agent)

Handles real-time news search and monitoring. Example prompts:

- **Search news**: "What's the latest news about artificial intelligence?"
- **Breaking news**: "Any breaking news right now?"
- **Financial news**: "What's happening in the stock market today?"

You can also have it push news on a schedule — just say "send me tech
stock news every morning at 9am" and it sets up a recurring task that
proactively delivers results, instead of you having to remember to ask.

---

## Core Use 6: Agent Market

The bar-chart icon in the top bar takes you to a grid of cards, each
one an agent you can enable. Click into any of them:

- If it's not yet enabled, you'll see a **Collect and chat** button —
  clicking it enables the agent and drops you straight into a
  conversation with it
- If it's already enabled, you'll see **Chat** to jump back in, plus a
  **Disable** button next to it

**⚠️ An important limitation**: if you're running the official one-click
Docker deployment (`docker compose up`), the default image **only
includes** Research Agent, Auto Trading Agent, News Agent, and the
ValueCell super-agent. The Agent Market may still list "investment
master" personas (Warren Buffett, Charlie Munger, etc.) and
TradingAgents' multi-analyst mode, but each of those needs its own
separate runtime environment that **the default image does not start**.
Clicking "Collect and chat" on one of those will likely hang or error
— that's not something you did wrong, those agents just need extra
manual setup beyond what ships by default (see the scope notes in
[RELEASE_CN.md](./RELEASE_CN.md)).

---

## Settings

Gear icon in the top bar → two options on the left:

### General

- **Quotes Color**: your color preference for price movement —
  "Green Up / Red Down" (the international convention) or
  "Red Up / Green Down" (the convention common in mainland China). This
  applies everywhere prices show up: charts, watchlist, everything.

### Memory

Shows what the AI has remembered about you (risk preferences, the kinds
of questions you tend to ask) to make future answers more relevant. You
can review and delete individual memories.

---

## FAQ

**Do I need to understand the multi-agent architecture to use this?**
No. All you need to know is "type it and see what happens" — how it
routes your request between agents internally is its problem, not
yours.

**Why do some questions answer instantly and others take a few
seconds?**
Simple questions the super-agent can answer directly come back
instantly. Complex tasks need a plan, a call to a specialist agent, and
sometimes an external data lookup — that naturally takes longer, and
you'll see the process happening live on screen rather than a frozen
spinner.

**Will auto trading spend money on its own without me knowing?**
No — it defaults to paper trading with zero real money involved.
Connecting a real exchange requires two separate, explicit opt-ins (see
[Core Use 4](#core-use-4-auto-trading-auto-trading-agent)), so it can't
happen by accident.

**Can multiple agents work on one request?**
Yes — just ask a compound, cross-domain question ("research Tesla, and
if the fundamentals look good, set up auto trading and subscribe to its
news"). ValueCell Agent breaks it down and coordinates the specialists
for you.

**Will I lose my conversation history?**
No, as long as you never ran `docker compose down -v` (the `-v` flag
wipes the data volumes). Conversations, your watchlist, and memory all
live in persistent volumes.

---

## Risk Disclaimer

- ValueCell is a technical tool — it **does not constitute investment
  advice**
- Auto trading involves real financial risk; validate any strategy
  thoroughly with paper trading first
- AI analysis and recommendations can be wrong; you are responsible for
  your own trading decisions
- Investing carries risk — proceed with care

---

## Getting Help

- Deployment or startup issues: check the "verified / not verified"
  table and the "bug found during verification" section in
  [RELEASE_CN.md](./RELEASE_CN.md) first — there's a good chance
  whatever you're hitting is that already-documented issue
- Want to understand how the system is designed:
  [ARCHITECTURE_CN.md](./ARCHITECTURE_CN.md)
- Want to get more out of auto trading:
  [PRODUCTION_GUIDE_CN.md](./PRODUCTION_GUIDE_CN.md) and
  [BACKTESTING_GUIDE_CN.md](./BACKTESTING_GUIDE_CN.md)
- Everything else: the repository's GitHub Issues

> **Note on language**: several of the deep-dive docs linked above are
> currently Chinese-only (`_CN` suffix). This user guide and its
> Chinese counterpart, [USER_GUIDE_CN.md](./USER_GUIDE_CN.md), are the
> two files actually meant for end users in either language; the rest
> is being translated incrementally.
