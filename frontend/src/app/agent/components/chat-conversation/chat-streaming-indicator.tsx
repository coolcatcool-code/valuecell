import { type FC, memo } from "react";

/**
 * The same small breathing dot that marks every AI turn (see
 * chat-item-area.tsx), shown on its own while nothing has streamed
 * back yet. Same visual language, no separate "loading spinner"
 * vocabulary — see docs/JOBS_WEB_DESIGN_CN.md §8.3.
 */
const StreamingIndicator: FC = () => {
  return (
    <output
      className="flex items-center gap-3 text-body text-ink-soft"
      aria-live="polite"
      aria-label="ValueCell is thinking"
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 animate-breathe rounded-full bg-ink"
      />
      <span>Thinking...</span>
    </output>
  );
};

export default memo(StreamingIndicator);
