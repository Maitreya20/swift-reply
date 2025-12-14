import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { time: "6 AM", calls: 4, messages: 3 },
  { time: "8 AM", calls: 12, messages: 10 },
  { time: "10 AM", calls: 28, messages: 24 },
  { time: "12 PM", calls: 35, messages: 30 },
  { time: "2 PM", calls: 42, messages: 38 },
  { time: "4 PM", calls: 38, messages: 35 },
  { time: "6 PM", calls: 22, messages: 20 },
  { time: "8 PM", calls: 8, messages: 7 },
];

export function ActivityChart() {
  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Today's Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(221 83% 53%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(221 83% 53%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(142 71% 45%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(142 71% 45%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="hsl(221 83% 53%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCalls)"
                name="Calls"
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="hsl(142 71% 45%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMessages)"
                name="Messages"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Calls</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Messages</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
