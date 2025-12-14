import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const messageLogs = [
  {
    id: "MSG-001",
    callId: "CL-001",
    phone: "+1 (555) 234-5678",
    template: "Appointment Confirmation",
    channel: "WhatsApp",
    status: "delivered",
    sentAt: "2024-01-15 14:33:00",
    deliveredAt: "2024-01-15 14:33:02",
  },
  {
    id: "MSG-002",
    callId: "CL-002",
    phone: "+1 (555) 345-6789",
    template: "Follow-up Reminder",
    channel: "WhatsApp",
    status: "delivered",
    sentAt: "2024-01-15 14:29:00",
    deliveredAt: "2024-01-15 14:29:03",
  },
  {
    id: "MSG-003",
    callId: "CL-003",
    phone: "+1 (555) 456-7890",
    template: "Appointment Confirmation",
    channel: "SMS",
    status: "failed",
    sentAt: "2024-01-15 14:16:00",
    deliveredAt: null,
    error: "Invalid number format",
  },
  {
    id: "MSG-004",
    callId: "CL-005",
    phone: "+1 (555) 678-9012",
    template: "Survey Request",
    channel: "WhatsApp",
    status: "delivered",
    sentAt: "2024-01-15 13:56:00",
    deliveredAt: "2024-01-15 13:56:01",
  },
  {
    id: "MSG-005",
    callId: "CL-006",
    phone: "+1 (555) 789-0123",
    template: "Payment Reminder",
    channel: "SMS",
    status: "delivered",
    sentAt: "2024-01-15 13:43:00",
    deliveredAt: "2024-01-15 13:43:05",
  },
  {
    id: "MSG-006",
    callId: "CL-007",
    phone: "+1 (555) 890-1234",
    template: "Appointment Confirmation",
    channel: "WhatsApp",
    status: "pending",
    sentAt: "2024-01-15 13:35:00",
    deliveredAt: null,
  },
];

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Message Logs</h1>
            <p className="text-muted-foreground">
              Track all sent messages and their delivery status
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by phone or message ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-channels">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-channels">All Channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-success/10 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">Delivered</span>
            </div>
            <p className="mt-1 text-2xl font-bold">147</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">Failed</span>
            </div>
            <p className="mt-1 text-2xl font-bold">9</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <p className="mt-1 text-2xl font-bold">3</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message ID</TableHead>
                <TableHead>Call ID</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Delivered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messageLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{log.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.callId}
                  </TableCell>
                  <TableCell>{log.phone}</TableCell>
                  <TableCell>{log.template}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      {log.channel}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "gap-1",
                        log.status === "delivered" &&
                          "bg-success/10 text-success",
                        log.status === "failed" &&
                          "bg-destructive/10 text-destructive",
                        log.status === "pending" &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {getStatusIcon(log.status)}
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.sentAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.deliveredAt
                      ? new Date(log.deliveredAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
