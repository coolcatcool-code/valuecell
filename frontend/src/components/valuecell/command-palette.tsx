import { Brain, Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { useGetAgentList } from "@/api/agent";
import { useGetConversationList } from "@/api/conversation";
import { ChartBarVertical, Logo, Setting } from "@/assets/svg";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TimeUtils } from "@/lib/time";
import { cn } from "@/lib/utils";
import AgentAvatar from "./agent-avatar";
import ScrollContainer from "./scroll/scroll-container";
import SvgIcon from "./svg-icon";

/**
 * Command palette is the single replacement for the old icon rail:
 * search history, summon an advisor persona, or jump to a settings page.
 * See docs/JOBS_WEB_DESIGN_CN.md §7.6.
 */
interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

export const useCommandPalette = () =>
  useCommandPaletteStore(
    useShallow((s) => ({
      open: s.open,
      setOpen: s.setOpen,
      toggle: s.toggle,
    })),
  );

type PaletteGroup = "Recent" | "Summon an advisor" | "Jump to";

interface PaletteAction {
  id: string;
  group: PaletteGroup;
  label: string;
  sublabel?: string;
  icon?: ReactNode;
  onSelect: () => void;
}

const GROUP_ORDER: PaletteGroup[] = ["Recent", "Summon an advisor", "Jump to"];

function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: conversations = [] } = useGetConversationList();
  const { data: agents = [] } = useGetAgentList({ enabled_only: "true" });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useCommandPaletteStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const actions = useMemo<PaletteAction[]>(() => {
    const goTo = (to: string) => {
      navigate(to);
      setOpen(false);
    };

    const recent: PaletteAction[] = conversations.slice(0, 6).map((c) => ({
      id: `conv-${c.conversation_id}`,
      group: "Recent",
      label: c.title,
      sublabel: TimeUtils.fromUTCRelative(c.update_time),
      icon: (
        <div className="size-6 shrink-0 overflow-hidden rounded-full">
          <AgentAvatar agentName={c.agent_name} />
        </div>
      ),
      onSelect: () => goTo(`/agent/${c.agent_name}?id=${c.conversation_id}`),
    }));

    const advisors: PaletteAction[] = (agents ?? [])
      .filter((a) => a.agent_name !== "ValueCellAgent")
      .slice(0, 8)
      .map((a) => ({
        id: `agent-${a.agent_name}`,
        group: "Summon an advisor" as const,
        label: a.display_name,
        sublabel: a.description,
        icon: (
          <div className="size-6 shrink-0 overflow-hidden rounded-full">
            <AgentAvatar agentName={a.agent_name} />
          </div>
        ),
        onSelect: () => goTo(`/agent/${a.agent_name}`),
      }));

    const jumps: PaletteAction[] = [
      {
        id: "jump-home",
        group: "Jump to",
        label: "Back to conversation",
        icon: <SvgIcon name={Logo} className="size-4" />,
        onSelect: () => goTo("/home"),
      },
      {
        id: "jump-market",
        group: "Jump to",
        label: "Agent Market",
        icon: <SvgIcon name={ChartBarVertical} className="size-4" />,
        onSelect: () => goTo("/market"),
      },
      {
        id: "jump-setting",
        group: "Jump to",
        label: "Settings",
        icon: <SvgIcon name={Setting} className="size-4" />,
        onSelect: () => goTo("/setting"),
      },
      {
        id: "jump-memory",
        group: "Jump to",
        label: "Memory",
        icon: <Brain className="size-4" />,
        onSelect: () => goTo("/setting/memory"),
      },
    ];

    return [...recent, ...advisors, ...jumps];
  }, [conversations, agents, navigate, setOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.sublabel?.toLowerCase().includes(q),
    );
  }, [actions, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden",
          "rounded-surface border-ink-faint/60 p-0 shadow-elevation-3",
        )}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>

        <div className="flex items-center gap-3 border-ink-faint border-b px-5 py-4">
          <Search className="size-4 shrink-0 text-ink-soft" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations, summon an advisor, or jump to a page..."
            className="w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-soft"
          />
          <kbd className="rounded-control border border-ink-faint px-1.5 py-0.5 text-caption text-ink-soft">
            esc
          </kbd>
        </div>

        <ScrollContainer className="max-h-[60vh]">
          <div className="p-2">
            {filtered.length === 0 && (
              <p className="px-3 py-8 text-center text-caption text-ink-soft">
                No matches found
              </p>
            )}

            {GROUP_ORDER.map((group) => {
              const items = filtered.filter((a) => a.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="px-3 pt-2 pb-1 text-caption text-ink-soft">
                    {group}
                  </p>
                  {items.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onSelect}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-control px-3 py-2 text-left",
                        "cursor-pointer transition-colors duration-150 hover:bg-paper-soft",
                      )}
                    >
                      {action.icon}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body text-ink leading-tight">
                          {action.label}
                        </span>
                        {action.sublabel && (
                          <span className="block truncate text-caption text-ink-soft">
                            {action.sublabel}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollContainer>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
