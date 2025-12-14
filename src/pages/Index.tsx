import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Phone, MessageSquare, CheckCircle, AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good morning, John
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your calls today.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Calls Today"
            value="189"
            change={12}
            icon={<Phone className="h-5 w-5 text-primary" />}
            variant="primary"
          />
          <StatCard
            title="Messages Sent"
            value="156"
            change={8}
            icon={<MessageSquare className="h-5 w-5 text-success" />}
            variant="success"
          />
          <StatCard
            title="Delivery Rate"
            value="94.2%"
            change={2.1}
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Failed Messages"
            value="9"
            change={-15}
            icon={<AlertTriangle className="h-5 w-5 text-warning" />}
          />
        </div>

        {/* Charts and activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityChart />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
