import { Command } from "lucide-react";
import { type FC, memo } from "react";
import { NavLink } from "react-router";
import { ChartBarVertical, Conversation, Logo, Setting } from "@/assets/svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import AppConversationSheet from "./app-conversation-sheet";
import { useCommandPaletteStore } from "./command-palette";
import SvgIcon from "./svg-icon";

/**
 * The entire navigation chrome for the app, replacing the old fixed
 * 64px icon rail. Everything that used to live in the sidebar now
 * lives here (quiet, 44px, near-transparent) or in the ⌘K palette.
 * See docs/JOBS_WEB_DESIGN_CN.md §7.1 / §7.6.
 */
interface TopBarIconProps {
  to?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const TopBarIconButton: FC<TopBarIconProps> = ({
  to,
  label,
  icon,
  onClick,
}) => {
  const className = cn(
    "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control",
    "text-ink-soft transition-colors duration-150 hover:bg-paper-soft hover:text-ink",
  );

  const content = to ? (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(className, isActive && "bg-paper-soft text-ink")
      }
      aria-label={label}
    >
      {icon}
    </NavLink>
  ) : (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
};

const AppTopBar: FC = () => {
  const toggleCommandPalette = useCommandPaletteStore((s) => s.toggle);

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-ink-faint border-b bg-paper/90 px-4 backdrop-blur-sm">
      <NavLink to="/home" className="flex items-center gap-2">
        <span className="relative flex size-6 items-center justify-center rounded-full bg-ink text-paper">
          <SvgIcon name={Logo} className="size-3.5 animate-breathe" />
        </span>
        <span className="font-medium text-body text-ink tracking-tight">
          ValueCell
        </span>
      </NavLink>

      <div className="flex items-center gap-1">
        <TopBarIconButton
          label="Agent Market"
          to="/market"
          icon={<SvgIcon name={ChartBarVertical} className="size-4" />}
        />

        <AppConversationSheet>
          <span>
            <TopBarIconButton
              label="Conversations"
              icon={<SvgIcon name={Conversation} className="size-4" />}
            />
          </span>
        </AppConversationSheet>

        <TopBarIconButton
          label="Settings"
          to="/setting"
          icon={<SvgIcon name={Setting} className="size-4" />}
        />

        <button
          type="button"
          onClick={toggleCommandPalette}
          className={cn(
            "ml-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-control border border-ink-faint px-2.5",
            "text-ink-soft transition-colors duration-150 hover:bg-paper-soft hover:text-ink",
          )}
          aria-label="Open command palette"
        >
          <Command className="size-3.5" />
          <kbd className="text-caption">K</kbd>
        </button>
      </div>
    </header>
  );
};

export default memo(AppTopBar);
