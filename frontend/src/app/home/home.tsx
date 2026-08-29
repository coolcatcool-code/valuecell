import { useState } from "react";
import { useNavigate } from "react-router";
import { useAllPollTaskList } from "@/api/conversation";
import { Logo } from "@/assets/svg";
import ScrollContainer from "@/components/valuecell/scroll/scroll-container";
import SvgIcon from "@/components/valuecell/svg-icon";
import { HOME_STOCK_SHOW } from "@/constants/stock";
import { agentSuggestions } from "@/mock/agent-data";
import ChatInputArea from "../agent/components/chat-conversation/chat-input-area";
import { AgentSuggestionsList, AgentTaskCards } from "./components";
import MarketTicker from "./components/market-ticker";
import { useSparklineStocks } from "./hooks/use-sparkline-stocks";

function Home() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState<string>("");

  const { data: allPollTaskList } = useAllPollTaskList();
  const { sparklineStocks } = useSparklineStocks(HOME_STOCK_SHOW);

  const handleAgentClick = (agentId: string) => {
    navigate(`/agent/${agentId}`);
  };

  const goToConversation = () =>
    navigate("/agent/ValueCellAgent", { state: { inputValue } });

  const hasTasks = allPollTaskList && allPollTaskList.length > 0;

  return (
    <div className="flex h-full min-w-[800px] flex-col gap-3">
      {hasTasks && <MarketTicker stocks={sparklineStocks} className="px-1" />}

      {hasTasks ? (
        <section className="flex flex-1 flex-col items-center justify-between gap-4 overflow-hidden">
          <ScrollContainer className="w-full">
            <AgentTaskCards tasks={allPollTaskList} />
          </ScrollContainer>

          <ChatInputArea
            className="w-full"
            value={inputValue}
            onChange={(value) => setInputValue(value)}
            onSend={goToConversation}
          />
        </section>
      ) : (
        <section className="relative flex w-full flex-1 flex-col items-center justify-center gap-10 overflow-hidden rounded-surface bg-paper py-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-ink text-paper">
              <SvgIcon name={Logo} className="size-7 animate-breathe" />
            </span>

            <div className="space-y-2">
              <h1 className="font-medium text-ink text-title">
                Hello, I'm ValueCell.
              </h1>
              <p className="text-body text-ink-soft">
                Say something, and we'll start from here.
              </p>
            </div>
          </div>

          <ChatInputArea
            className="w-3/4 max-w-[800px]"
            value={inputValue}
            onChange={(value) => setInputValue(value)}
            onSend={goToConversation}
          />

          <MarketTicker stocks={sparklineStocks} />

          <AgentSuggestionsList
            suggestions={agentSuggestions.map((suggestion) => ({
              ...suggestion,
              onClick: () => handleAgentClick(suggestion.id),
            }))}
          />
        </section>
      )}
    </div>
  );
}

export default Home;
