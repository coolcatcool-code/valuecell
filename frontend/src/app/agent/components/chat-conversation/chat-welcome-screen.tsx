import { type FC, memo } from "react";
import ChatInputArea from "./chat-input-area";

interface ChatWelcomeScreenProps {
  title: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
  disabled?: boolean;
}

const ChatWelcomeScreen: FC<ChatWelcomeScreenProps> = ({
  title,
  inputValue,
  onInputChange,
  onSendMessage,
  disabled = false,
}) => {
  return (
    <>
      {/* Background blur effects for welcome screen */}
      <ChatBackground />

      {/* Welcome content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-12">
        <h1 className="text-center font-medium text-ink text-title">{title}</h1>

        {/* Input card */}
        <ChatInputArea
          value={inputValue}
          onChange={onInputChange}
          onSend={onSendMessage}
          disabled={disabled}
          variant="welcome"
        />
      </div>
    </>
  );
};

/**
 * A single, quiet brand-tinted glow — not a five-color blur farm.
 * Color is spent once, on purpose. See docs/JOBS_WEB_DESIGN_CN.md §6.3.
 */
const ChatBackground = () => (
  <div
    aria-hidden="true"
    className="-z-10 -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[45vh] w-[45vh] rounded-full bg-brand/[0.06] blur-[120px]"
  />
);

export default memo(ChatWelcomeScreen);
