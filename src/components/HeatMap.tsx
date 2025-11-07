import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface HeatMapData {
  date: string;
  count: number;
}

interface HeatMapProps {
  data: HeatMapData[];
  longestStreak?: number;
  totalProblemsSolved?: number;
}

export const HeatMap = ({ data, longestStreak = 0, totalProblemsSolved = 0 }: HeatMapProps) => {
  const [heatmapCells, setHeatmapCells] = useState<Array<{ date: Date; count: number; dayOfWeek: number }>>([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    activeDays: 0,
    maxStreak: longestStreak,
    timeRange: '',
  });
  const [dataSeemsLimited, setDataSeemsLimited] = useState(false);

  useEffect(() => {
    // Create a map of date strings to counts
    const dataMap = new Map<string, number>();
    let totalSubmissions = 0;
    let activeDays = 0;
    
    data.forEach((item) => {
      dataMap.set(item.date, item.count);
      totalSubmissions += item.count;
      if (item.count > 0) activeDays++;
    });

    // Find the earliest and latest dates from the data
    const dates = data.map(item => new Date(item.date)).filter(d => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use the earliest date from data (lifetime data)
    const earliestDate = dates.length > 0 ? dates[0] : new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    earliestDate.setHours(0, 0, 0, 0);
    
    // Log for debugging
    if (dates.length > 0) {
      console.log(`Heatmap: ${data.length} days with activity, earliest: ${earliestDate.toISOString().split('T')[0]}, latest: ${dates[dates.length - 1].toISOString().split('T')[0]}`);
    }

    // Calculate time range (in months)
    const monthsDiff = (today.getFullYear() - earliestDate.getFullYear()) * 12 + (today.getMonth() - earliestDate.getMonth());
    const years = Math.floor(monthsDiff / 12);
    const months = monthsDiff % 12;
    
    let timeRange = '';
    if (years > 0) {
      timeRange = `${years} year${years > 1 ? 's' : ''}`;
      if (months > 0) {
        timeRange += ` ${months} month${months > 1 ? 's' : ''}`;
      }
    } else if (monthsDiff > 0) {
      timeRange = `${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`;
    } else {
      timeRange = 'lifetime';
    }
    
    // Check if data seems limited (less than 3 months) - might need to refresh stats
    const dataSeemsLimited = monthsDiff < 3 && dates.length > 0;

    // Use the earliest date from data for lifetime stats (no limit)
    const startDate = new Date(earliestDate);
    startDate.setHours(0, 0, 0, 0);

    // Calculate total days from start to today
    const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Find the first Sunday before or on startDate
    const firstSunday = new Date(startDate);
    const dayOfWeek = firstSunday.getDay();
    firstSunday.setDate(firstSunday.getDate() - dayOfWeek);

    // Generate cells for ALL days from startDate to today
    const cells: Array<{ date: Date; count: number; dayOfWeek: number }> = [];
    
    for (let i = 0; i < totalDays + 7; i++) {
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
    setStats({
      totalSubmissions: totalProblemsSolved || totalSubmissions, // Use totalProblemsSolved if provided (includes all sources), otherwise sum from heatmap
      activeDays,
      maxStreak: longestStreak,
      timeRange,
    });
    setDataSeemsLimited(dataSeemsLimited);
  }, [data, longestStreak, totalProblemsSolved]);

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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Activity Heat Map</h3>
        </div>
        
        {/* Statistics */}
        <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
          <div className="font-medium">
            {stats.totalSubmissions} submission{stats.totalSubmissions !== 1 ? 's' : ''} {stats.timeRange ? `in the past ${stats.timeRange}` : ''}
          </div>
          <div>
            <span className="text-muted-foreground">
              Total active days: <span className="font-medium text-foreground">{stats.activeDays}</span>
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">
              Max streak: <span className="font-medium text-foreground">{stats.maxStreak}</span>
            </span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Your coding activity across all platforms (lifetime)
        </p>
        {dataSeemsLimited && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            💡 Tip: Refresh your platform stats to load complete lifetime data from LeetCode and CodeChef
          </p>
        )}
      </div>

      <div className="relative">
        {/* Day labels - fixed on left */}
        <div className="absolute left-0 top-0 z-10 flex flex-col gap-1.5 mr-3 text-xs text-muted-foreground pt-7 bg-card pr-2">
          <div className="h-3.5"></div>
          <div className="h-3.5 flex items-center">S</div>
          <div className="h-3.5 flex items-center">M</div>
          <div className="h-3.5 flex items-center">T</div>
          <div className="h-3.5 flex items-center">W</div>
          <div className="h-3.5 flex items-center">T</div>
          <div className="h-3.5 flex items-center">F</div>
          <div className="h-3.5 flex items-center">S</div>
        </div>

        {/* Scrollable heatmap container */}
        <div className="heatmap-scroll overflow-x-auto overflow-y-visible pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex gap-1.5 items-start pl-8">
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
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
        <div className="text-xs text-muted-foreground">
          Includes: App challenges, LeetCode, CodeChef
        </div>
      </div>
    </Card>
  );
};

