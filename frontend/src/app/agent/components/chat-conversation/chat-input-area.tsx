import { ArrowUp } from "lucide-react";
import { type FC, memo } from "react";
import { Button } from "@/components/ui/button";
import ScrollTextarea from "@/components/valuecell/scroll/scroll-textarea";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void> | void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "welcome" | "chat";
}

const ChatInputArea: FC<ChatInputAreaProps> = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  placeholder = "Ask me anything about investing...",
  disabled = false,
  className,
  variant = "chat",
}) => {
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter key (excluding Shift+Enter line breaks and IME composition state)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      await onSend();
    }
    onKeyDown?.(e);
  };

  const handleSend = async () => {
    if (!value.trim() || disabled) return;
    await onSend();
  };

  const isWelcomeVariant = variant === "welcome";

  return (
    <div
      className={cn(
        "vc-chat-input flex flex-col gap-2 rounded-surface bg-paper p-4",
        "border border-ink-faint shadow-elevation-1",
        isWelcomeVariant && "w-2/3 min-w-[600px]",
        !isWelcomeVariant && "w-full",
        className,
      )}
    >
      <ScrollTextarea
        value={value}
        onInput={(e) => onChange(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxHeight={120}
        minHeight={24}
        disabled={disabled}
      />
      <Button
        size="icon"
        className="size-8 cursor-pointer self-end rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <ArrowUp size={16} />
      </Button>
    </div>
  );
};

export default memo(ChatInputArea);
