import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "message",
    status: "delivered",
    customer: "+1 (555) 234-5678",
    time: "2 min ago",
    channel: "WhatsApp",
  },
  {
    id: 2,
    type: "call",
    status: "completed",
    customer: "+1 (555) 345-6789",
    time: "5 min ago",
    duration: "4:32",
  },
  {
    id: 3,
    type: "message",
    status: "failed",
    customer: "+1 (555) 456-7890",
    time: "8 min ago",
    channel: "SMS (fallback)",
  },
  {
    id: 4,
    type: "call",
    status: "completed",
    customer: "+1 (555) 567-8901",
    time: "12 min ago",
    duration: "2:15",
  },
  {
    id: 5,
    type: "message",
    status: "delivered",
    customer: "+1 (555) 678-9012",
    time: "15 min ago",
    channel: "WhatsApp",
  },
];

export function RecentActivity() {
  return (
    <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  activity.type === "call" ? "bg-primary/10" : "bg-success/10"
                )}
              >
                {activity.type === "call" ? (
                  <Phone className="h-5 w-5 text-primary" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-success" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activity.customer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.type === "call"
                    ? `Call duration: ${activity.duration}`
                    : activity.channel}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant={
                    activity.status === "delivered" ||
                    activity.status === "completed"
                      ? "default"
                      : "destructive"
                  }
                  className={cn(
                    "text-xs",
                    (activity.status === "delivered" ||
                      activity.status === "completed") &&
                      "bg-success/10 text-success hover:bg-success/20"
                  )}
                >
                  {activity.status === "delivered" ||
                  activity.status === "completed" ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertCircle className="mr-1 h-3 w-3" />
                  )}
                  {activity.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
