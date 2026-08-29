import { memo } from "react";
import { cn, formatChange, getChangeType } from "@/lib/utils";
import { useStockColors } from "@/store/settings-store";
import type { SparklineStock } from "./sparkline-stock-list";

/**
 * A single quiet line replacing the three permanent index cards that used
 * to occupy the top of the home screen. The market is ambient information,
 * not the protagonist — see docs/JOBS_WEB_DESIGN_CN.md §7.7.
 */
interface MarketTickerProps {
  stocks: SparklineStock[];
  className?: string;
}

function MarketTicker({ stocks, className }: MarketTickerProps) {
  const stockColors = useStockColors();

  if (stocks.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-1 text-caption",
        className,
      )}
    >
      {stocks.map((stock) => {
        const changeType = getChangeType(stock.changePercent);
        return (
          <span key={stock.symbol} className="flex items-center gap-1.5">
            <span className="text-ink-soft">{stock.symbol}</span>
            <span className="vc-tabular-nums text-ink">
              {stock.price.toFixed(2)}
            </span>
            <span
              className="vc-tabular-nums"
              style={{ color: stockColors[changeType] }}
            >
              {formatChange(stock.changePercent, "%")}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default memo(MarketTicker);
