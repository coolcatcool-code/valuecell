import BackButton from "@valuecell/button/back-button";
import Sparkline from "@valuecell/charts/sparkline";
import { memo, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useGetStockDetail,
  useGetStockHistory,
  useGetStockPrice,
  useRemoveStockFromWatchlist,
} from "@/api/stock";
import { Button } from "@/components/ui/button";
import { TimeUtils } from "@/lib/time";
import { formatChange, getChangeType } from "@/lib/utils";
import { useStockBadgeColors } from "@/store/settings-store";
import type { SparklineData } from "@/types/chart";
import type { Route } from "./+types/stock";

function Stock() {
  const { stockId } = useParams<Route.LoaderArgs["params"]>();
  const navigate = useNavigate();
  const badgeColors = useStockBadgeColors();
  // Use stockId as ticker to fetch real data from API
  const ticker = stockId || "";

  // Fetch current stock price data
  const {
    data: stockPriceData,
    isLoading: isPriceLoading,
    error: priceError,
  } = useGetStockPrice({
    ticker,
  });

  // Fetch stock detail data
  const {
    data: stockDetailData,
    isLoading: isDetailLoading,
    error: detailError,
  } = useGetStockDetail({
    ticker,
  });

  // Remove stock from watchlist mutation
  const removeStockMutation = useRemoveStockFromWatchlist();

  // Handle remove stock from watchlist
  const handleRemoveStock = async () => {
    try {
      await removeStockMutation.mutateAsync(ticker);

      navigate(-1);
    } catch (error) {
      console.error("Failed to remove stock from watchlist:", error);
      // Handle error - could show error toast
    }
  };

  // Calculate date range for 60-day historical data
  const dateRange = useMemo(() => {
    const now = TimeUtils.nowUTC();
    const sixtyDaysAgo = now.subtract(60, "day");
    return {
      startDate: sixtyDaysAgo.toISOString(),
      endDate: now.toISOString(),
    };
  }, []);

  // Fetch historical data for chart
  const {
    data: stockHistoryData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useGetStockHistory({
    ticker,
    interval: "1d",
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
  });

  // Transform historical data to chart format
  const chartData = useMemo(() => {
    if (!stockHistoryData?.prices) return [];

    // Convert UTC timestamp strings to UTC millisecond timestamps for chart
    const sparklineData: SparklineData = stockHistoryData.prices.map(
      (price) => [
        TimeUtils.createUTC(price.timestamp).valueOf(),
        price.close_price,
      ],
    );

    return sparklineData;
  }, [stockHistoryData]);

  // Create stock info from API data
  const stockInfo = useMemo(() => {
    if (!stockPriceData) return null;

    // Use display name from detail data if available, otherwise use ticker
    const companyName = stockDetailData?.display_name || ticker;

    return {
      symbol: ticker,
      companyName,
      price: stockPriceData.price_formatted,
      changePercent: stockPriceData.change_percent,
      currency: stockPriceData.currency,
      changeAmount: stockPriceData.change,
    };
  }, [stockPriceData, stockDetailData, ticker]);

  // Handle loading states
  if (isPriceLoading || isHistoryLoading || isDetailLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-body text-ink-soft">Loading stock data...</div>
      </div>
    );
  }

  // Handle error states
  if (priceError || historyError || detailError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="text-body text-signal-danger">
          Error loading stock data:{" "}
          {priceError?.message || historyError?.message || detailError?.message}
        </div>
        <Button
          variant="secondary"
          className="cursor-pointer"
          onClick={handleRemoveStock}
          disabled={removeStockMutation.isPending}
        >
          {removeStockMutation.isPending ? "Removing..." : "Remove"}
        </Button>
      </div>
    );
  }

  // Handle no data found
  if (!stockInfo || !stockPriceData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-body text-ink-soft">Stock {stockId} not found</div>
      </div>
    );
  }

  const changeType = getChangeType(stockInfo.changePercent);

  return (
    <div className="flex animate-surface-in flex-col gap-8 bg-paper px-8 py-6">
      {/* Stock Main Info — this page behaves like a Surface panel that
          slid in from the right, even though it is still its own route.
          See docs/JOBS_WEB_DESIGN_CN.md §7.4. */}
      <div className="flex flex-col gap-4">
        <BackButton />

        <div className="flex items-center gap-2">
          <span className="font-medium text-emphasis text-ink">
            {stockInfo.companyName}
          </span>

          <Button
            variant="secondary"
            className="ml-auto"
            onClick={handleRemoveStock}
            disabled={removeStockMutation.isPending}
          >
            {removeStockMutation.isPending ? "Removing..." : "Remove"}
          </Button>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="vc-tabular-nums font-medium text-display text-ink">
              {stockInfo.price}
            </span>
            <span
              className="rounded-control px-2 py-1 font-medium text-caption"
              style={{
                backgroundColor: badgeColors[changeType].bg,
                color: badgeColors[changeType].text,
              }}
            >
              {formatChange(stockInfo.changePercent, "%")}
            </span>
          </div>
          <p className="text-caption text-ink-soft">
            {/* Convert UTC timestamp to local time for display */}
            {TimeUtils.fromUTC(stockPriceData.timestamp).format(
              "MMM DD, YYYY h:mm:ss A",
            )}{" "}
            . {stockPriceData.source} . Disclaimer
          </p>
        </div>

        <Sparkline data={chartData} changeType={changeType} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-medium text-emphasis text-ink">About</h2>

        <p className="line-clamp-4 text-body text-ink-soft leading-relaxed">
          {stockDetailData?.properties?.business_summary}
        </p>

        {stockDetailData?.properties && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-caption">
            <div>
              <span className="text-ink-soft">Sector:</span>
              <span className="ml-2 font-medium text-ink">
                {stockDetailData.properties.sector}
              </span>
            </div>
            <div>
              <span className="text-ink-soft">Industry:</span>
              <span className="ml-2 font-medium text-ink">
                {stockDetailData.properties.industry}
              </span>
            </div>
            {stockDetailData.properties.website && (
              <div className="col-span-2">
                <span className="text-ink-soft">Website:</span>
                <a
                  href={stockDetailData.properties.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-brand hover:underline"
                >
                  {stockDetailData.properties.website}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Stock);
