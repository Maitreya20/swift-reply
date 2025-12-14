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
import { Search, Filter, Download, Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const callLogs = [
  {
    id: "CL-001",
    phone: "+1 (555) 234-5678",
    duration: "4:32",
    agent: "Sarah M.",
    status: "completed",
    messageStatus: "delivered",
    channel: "WhatsApp",
    timestamp: "2024-01-15 14:32:00",
  },
  {
    id: "CL-002",
    phone: "+1 (555) 345-6789",
    duration: "2:15",
    agent: "Mike R.",
    status: "completed",
    messageStatus: "delivered",
    channel: "WhatsApp",
    timestamp: "2024-01-15 14:28:00",
  },
  {
    id: "CL-003",
    phone: "+1 (555) 456-7890",
    duration: "6:48",
    agent: "Sarah M.",
    status: "completed",
    messageStatus: "failed",
    channel: "SMS",
    timestamp: "2024-01-15 14:15:00",
  },
  {
    id: "CL-004",
    phone: "+1 (555) 567-8901",
    duration: "1:05",
    agent: "John D.",
    status: "missed",
    messageStatus: "pending",
    channel: "-",
    timestamp: "2024-01-15 14:02:00",
  },
  {
    id: "CL-005",
    phone: "+1 (555) 678-9012",
    duration: "3:22",
    agent: "Mike R.",
    status: "completed",
    messageStatus: "delivered",
    channel: "WhatsApp",
    timestamp: "2024-01-15 13:55:00",
  },
  {
    id: "CL-006",
    phone: "+1 (555) 789-0123",
    duration: "5:10",
    agent: "Sarah M.",
    status: "completed",
    messageStatus: "delivered",
    channel: "SMS",
    timestamp: "2024-01-15 13:42:00",
  },
];

export default function CallLogs() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Call Logs</h1>
            <p className="text-muted-foreground">
              View and manage all your call records
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
              placeholder="Search by phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-messages">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Message Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-messages">All Messages</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Call Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{log.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {log.phone}
                    </div>
                  </TableCell>
                  <TableCell>{log.duration}</TableCell>
                  <TableCell>{log.agent}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        log.status === "completed" &&
                          "bg-success/10 text-success",
                        log.status === "missed" &&
                          "bg-warning/10 text-warning"
                      )}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        log.messageStatus === "delivered" &&
                          "bg-success/10 text-success",
                        log.messageStatus === "failed" &&
                          "bg-destructive/10 text-destructive",
                        log.messageStatus === "pending" &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {log.messageStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.channel !== "-" && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        {log.channel}
                      </div>
                    )}
                    {log.channel === "-" && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
