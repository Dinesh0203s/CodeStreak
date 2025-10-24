import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface HeatMapData {
  date: string;
  count: number;
}

interface HeatMapProps {
  data: HeatMapData[];
}

export const HeatMap = ({ data }: HeatMapProps) => {
  const [heatmapCells, setHeatmapCells] = useState<Array<{ date: Date; count: number; dayOfWeek: number }>>([]);

  useEffect(() => {
    // Create a map of date strings to counts
    const dataMap = new Map<string, number>();
    data.forEach((item) => {
      dataMap.set(item.date, item.count);
    });

    // Generate cells for the last 365 days (or 53 weeks)
    const cells: Array<{ date: Date; count: number; dayOfWeek: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 365 days ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 365);

    // Find the first Sunday before or on startDate
    const firstSunday = new Date(startDate);
    const dayOfWeek = firstSunday.getDay();
    firstSunday.setDate(firstSunday.getDate() - dayOfWeek);

    // Generate cells for each day
    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(firstSunday);
      currentDate.setDate(firstSunday.getDate() + i);

      if (currentDate > today) break;

      const dateKey = currentDate.toISOString().split('T')[0];
      const count = dataMap.get(dateKey) || 0;
      const dayOfWeekNum = currentDate.getDay();

      cells.push({
        date: currentDate,
        count,
        dayOfWeek: dayOfWeekNum,
      });
    }

    setHeatmapCells(cells);
  }, [data]);

  // Get color intensity based on count - using green colors
  const getColor = (count: number): string => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-green-300';
    if (count === 2) return 'bg-green-400';
    if (count === 3) return 'bg-green-500';
    if (count >= 4) return 'bg-green-600';
    return 'bg-muted';
  };

  // Group cells by week
  const weeks: Array<Array<{ date: Date; count: number; dayOfWeek: number }>> = [];
  let currentWeek: Array<{ date: Date; count: number; dayOfWeek: number }> = [];

  heatmapCells.forEach((cell, index) => {
    if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [cell];
    } else {
      currentWeek.push(cell);
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Fill incomplete weeks with empty cells
  const filledWeeks = weeks.map((week) => {
    const filledWeek = Array(7).fill(null);
    week.forEach((cell) => {
      filledWeek[cell.dayOfWeek] = cell;
    });
    return filledWeek;
  });

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const maxCount = Math.max(...heatmapCells.map((c) => c.count), 1);
  
  // Check if there's any actual activity (count > 0)
  const hasActivity = heatmapCells.some((c) => c.count > 0);

  if (data.length === 0 || !hasActivity) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Activity Heat Map</h3>
          <p className="text-sm text-muted-foreground">
            Your coding activity over the past year
          </p>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>No activity data available yet.</p>
          <p className="text-xs mt-2">Start solving challenges or refresh your platform stats to see your activity!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Activity Heat Map</h3>
        <p className="text-sm text-muted-foreground">
          Your coding activity over the past year
        </p>
        {data.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Showing {data.length} days with activity
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1.5 items-start">
          {/* Day labels */}
          <div className="flex flex-col gap-1.5 mr-3 text-xs text-muted-foreground pt-7">
            <div className="h-3.5"></div>
            <div className="h-3.5 flex items-center">S</div>
            <div className="h-3.5 flex items-center">M</div>
            <div className="h-3.5 flex items-center">T</div>
            <div className="h-3.5 flex items-center">W</div>
            <div className="h-3.5 flex items-center">T</div>
            <div className="h-3.5 flex items-center">F</div>
            <div className="h-3.5 flex items-center">S</div>
          </div>

          {/* Heat map cells */}
          <div className="flex gap-1.5">
            {filledWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1.5">
                {week.map((cell, dayIndex) => {
                  if (!cell) {
                    return <div key={dayIndex} className="w-3.5 h-3.5" />;
                  }

                  return (
                    <TooltipProvider key={dayIndex}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-3.5 h-3.5 border border-border/30 cursor-pointer hover:border-border hover:scale-110 transition-all ${getColor(
                              cell.count
                            )}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">{formatDate(cell.date)}</div>
                            <div className="text-muted-foreground">
                              {cell.count === 0
                                ? 'No submissions'
                                : `${cell.count} problem${cell.count > 1 ? 's' : ''} solved`}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
        <span className="text-xs">Less</span>
        <div className="flex gap-1.5">
          <div className="w-3.5 h-3.5 bg-muted border border-border/30" />
          <div className="w-3.5 h-3.5 bg-green-300 border border-border/30" />
          <div className="w-3.5 h-3.5 bg-green-400 border border-border/30" />
          <div className="w-3.5 h-3.5 bg-green-500 border border-border/30" />
          <div className="w-3.5 h-3.5 bg-green-600 border border-border/30" />
        </div>
        <span className="text-xs">More</span>
      </div>
    </Card>
  );
};

