import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Download,
  CheckCircle,
  Zap,
  MessageSquare,
  Phone,
  ExternalLink,
} from "lucide-react";

const invoices = [
  {
    id: "INV-2024-001",
    date: "Jan 1, 2024",
    amount: "$149.00",
    status: "paid",
  },
  {
    id: "INV-2023-012",
    date: "Dec 1, 2023",
    amount: "$149.00",
    status: "paid",
  },
  {
    id: "INV-2023-011",
    date: "Nov 1, 2023",
    amount: "$99.00",
    status: "paid",
  },
  {
    id: "INV-2023-010",
    date: "Oct 1, 2023",
    amount: "$99.00",
    status: "paid",
  },
];

export default function Billing() {
  const messagesUsed = 1247;
  const messagesLimit = 2000;
  const messagesPercent = (messagesUsed / messagesLimit) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Billing & Usage
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and view usage
          </p>
        </div>

        {/* Current plan */}
        <Card className="overflow-hidden">
          <div className="gradient-primary p-6 text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 mb-3">
                  Current Plan
                </Badge>
                <h2 className="text-2xl font-bold">Growth Plan</h2>
                <p className="opacity-90 mt-1">
                  Perfect for growing SMEs with moderate call volumes
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">$149</p>
                <p className="text-sm opacity-90">/month</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Messages included
                  </p>
                  <p className="font-semibold">2,000 / month</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Phone numbers
                  </p>
                  <p className="font-semibold">3 included</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Team members
                  </p>
                  <p className="font-semibold">5 seats</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline">Change Plan</Button>
              <Button variant="ghost" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Manage in Stripe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {messagesUsed.toLocaleString()} of{" "}
                  {messagesLimit.toLocaleString()} messages used
                </span>
                <span className="font-medium">{Math.round(messagesPercent)}%</span>
              </div>
              <Progress value={messagesPercent} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Resets on February 1, 2024
              </p>
              {messagesPercent > 80 && (
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
                  <p className="text-sm text-warning font-medium">
                    You're approaching your monthly limit. Consider upgrading
                    for more messages.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="rounded-lg bg-card p-2 border">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">
                    Expires 12/2025
                  </p>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Default
                </Badge>
              </div>
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Invoice history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-success/10 text-success"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
