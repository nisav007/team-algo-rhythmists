import { useGetFallsSummary, useListFalls } from "@workspace/api-client-react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportFallDialog } from "@/components/report-fall-dialog";
import { Activity, AlertTriangle, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetFallsSummary();
  const { data: recentFalls, isLoading: isFallsLoading } = useListFalls();

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system status and report incidents.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Urgent Action Area */}
        <div className="md:col-span-2 lg:col-span-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Emergency Response
            </h2>
            <p className="text-red-600/80 dark:text-red-300/80 mt-1">
              If a fall has occurred, trigger an alert immediately. Contacts will be notified via SMS.
            </p>
          </div>
          <div className="w-full md:w-auto min-w-[240px]">
            <ReportFallDialog />
          </div>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falls Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-today">
                {summary?.todayFalls || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falls This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-week">
                {summary?.thisWeekFalls || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Incident</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-lg font-medium" data-testid="stat-last-fall">
                {summary?.lastFallAt ? formatDistanceToNow(new Date(summary.lastFallAt), { addSuffix: true }) : "No incidents"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-contacts">
                {summary?.totalContacts || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Recent Activity</h3>
        <Card>
          <div className="divide-y border-t-0">
            {isFallsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : recentFalls?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No recent fall events recorded.
              </div>
            ) : (
              recentFalls?.slice(0, 5).map((fall) => (
                <div key={fall.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-testid={`recent-fall-${fall.id}`}>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">
                        Fall Detected
                      </h4>
                      <Badge variant={fall.smsStatus === "completed" ? "default" : fall.smsStatus === "failed" ? "destructive" : "secondary"}>
                        {fall.smsStatus === "completed" ? "Alerts Sent" : fall.smsStatus}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(fall.detectedAt), "PPp")}
                      </span>
                      {fall.location && (
                        <span className="font-medium text-foreground">
                          Location: {fall.location}
                        </span>
                      )}
                    </div>
                    {fall.notes && (
                      <p className="text-sm mt-2 text-muted-foreground">"{fall.notes}"</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
