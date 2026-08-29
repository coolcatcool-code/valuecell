import { Plus } from "lucide-react";
import { Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import ScrollContainer from "@/components/valuecell/scroll/scroll-container";
import StockList from "./components/stock-list";
import StockSearchModal from "./components/stock-search-modal";

export default function HomeLayout() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden bg-paper-soft py-4 pr-4 pl-2">
      <div className="flex flex-1 gap-3 overflow-hidden">
        <main className="h-full flex-1 overflow-hidden rounded-surface">
          <ScrollContainer className="h-full">
            <Outlet />
          </ScrollContainer>
        </main>

        <aside className="flex min-w-62 max-w-80 flex-col justify-between rounded-surface bg-paper">
          <StockList />

          <StockSearchModal>
            <Button
              variant="secondary"
              className="mx-5 mb-6 font-medium text-sm"
            >
              <Plus size={16} />
              Add Stocks
            </Button>
          </StockSearchModal>
        </aside>
      </div>
    </div>
  );
}
