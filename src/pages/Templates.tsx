import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Clock, CheckCircle } from "lucide-react";

const templates = [
  {
    id: 1,
    name: "Appointment Confirmation",
    description: "Confirms the appointment details after a call",
    channel: "WhatsApp",
    status: "active",
    usageCount: 1247,
    preview:
      "Hi {name}! Your appointment is confirmed for {date} at {time}. Reply YES to confirm or call us at {phone} to reschedule.",
  },
  {
    id: 2,
    name: "Follow-up Reminder",
    description: "Sends a reminder 24 hours before the appointment",
    channel: "WhatsApp",
    status: "active",
    usageCount: 892,
    preview:
      "Hi {name}, just a reminder about your appointment tomorrow at {time}. See you then! Reply CANCEL if you need to reschedule.",
  },
  {
    id: 3,
    name: "Survey Request",
    description: "Asks for feedback after service completion",
    channel: "WhatsApp",
    status: "active",
    usageCount: 654,
    preview:
      "Thank you for choosing us, {name}! How was your experience? Reply with a rating from 1-5 stars.",
  },
  {
    id: 4,
    name: "Payment Reminder",
    description: "Gentle reminder for pending payments",
    channel: "SMS",
    status: "active",
    usageCount: 423,
    preview:
      "Hi {name}, you have an outstanding balance of {amount}. Pay online at {link} or call us at {phone}.",
  },
  {
    id: 5,
    name: "Service Complete",
    description: "Notification when a service has been completed",
    channel: "WhatsApp",
    status: "draft",
    usageCount: 0,
    preview:
      "Great news {name}! Your {service} is complete. Pick up anytime during business hours. Thank you!",
  },
];

export default function Templates() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Message Templates
          </h1>
          <p className="text-muted-foreground">
            Pre-configured templates for automated messages
          </p>
        </div>

        {/* Info banner */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Templates are managed by your admin</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contact your account administrator to add, edit, or remove
                message templates. This keeps your messaging consistent and
                compliant.
              </p>
            </div>
          </div>
        </div>

        {/* Templates grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-lg transition-shadow animate-slide-up"
              style={{ animationDelay: `${template.id * 0.05}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      template.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {template.status === "active" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {template.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm text-muted-foreground italic">
                    "{template.preview}"
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.channel}</Badge>
                  </div>
                  <span className="text-muted-foreground">
                    Used {template.usageCount.toLocaleString()} times
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
