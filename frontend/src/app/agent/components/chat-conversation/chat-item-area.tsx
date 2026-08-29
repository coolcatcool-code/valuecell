import { type FC, memo } from "react";
import { UnknownRenderer } from "@/components/valuecell/renderer";
import { COMPONENT_RENDERER_MAP } from "@/constants/agent";
import { cn } from "@/lib/utils";
import { useMultiSection } from "@/provider/multi-section-provider";
import type { ChatItem } from "@/types/agent";

export interface ChatItemAreaProps {
  items: ChatItem[];
}

/**
 * User turns stay quiet, right-aligned, bubbled in a soft neutral fill.
 * AI turns carry no bubble at all — only a small breathing dot marks
 * "this is ValueCell speaking," so the content itself stays the focus.
 * See docs/JOBS_WEB_DESIGN_CN.md §7.3.
 */
const ChatItemArea: FC<ChatItemAreaProps> = ({ items }) => {
  const { currentSection, openSection } = useMultiSection();

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isUser = item.role === "user";

        const rendered = (() => {
          const RendererComponent = COMPONENT_RENDERER_MAP[item.component_type];

          if (!item.payload) return null;
          switch (item.component_type) {
            case "markdown":
            case "tool_call":
            case "subagent_conversation":
            case "scheduled_task_controller":
              return <RendererComponent content={item.payload.content} />;

            case "report":
              return (
                <RendererComponent
                  content={item.payload.content}
                  onOpen={() => openSection(item)}
                  isActive={currentSection?.item_id === item.item_id}
                />
              );

            default:
              return (
                <UnknownRenderer item={item} content={item.payload.content} />
              );
          }
        })();

        return (
          <div
            key={item.item_id}
            className={cn(
              "flex gap-3",
              isUser ? "justify-end" : "justify-start",
            )}
          >
            {isUser ? (
              <div className="max-w-[80%] rounded-surface bg-paper-soft px-4 py-2.5 text-body text-ink">
                {rendered}
              </div>
            ) : (
              <div className="flex w-full max-w-[85%] items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 animate-breathe rounded-full bg-ink"
                />
                <div className="min-w-0 flex-1 text-body text-ink">
                  {rendered}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default memo(ChatItemArea);
