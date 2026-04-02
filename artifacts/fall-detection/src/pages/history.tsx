import { useListFalls, useDeleteFall, getListFallsQueryKey, getGetFallsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export default function History() {
  const { data: falls, isLoading } = useListFalls();
  const deleteFall = useDeleteFall();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this event log?")) return;
    
    deleteFall.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFallsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFallsSummaryQueryKey() });
          toast({ title: "Event deleted" });
        },
        onError: () => {
          toast({ title: "Failed to delete event", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Event History</h1>
        <p className="text-muted-foreground mt-2">
          Complete log of all detected falls and alert statuses.
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alerts Sent</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : falls?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/50" />
                      No events recorded
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                falls?.map((fall) => (
                  <TableRow key={fall.id} data-testid={`row-fall-${fall.id}`}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(fall.detectedAt), "MMM d, yyyy")}
                      <div className="text-xs text-muted-foreground font-normal">
                        {format(new Date(fall.detectedAt), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fall.location || <span className="text-muted-foreground italic">Unknown</span>}
                      {fall.notes && (
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={fall.notes}>
                          {fall.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={fall.smsStatus === "completed" ? "default" : fall.smsStatus === "failed" ? "destructive" : "secondary"}
                        className="capitalize"
                      >
                        {fall.smsStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{fall.smsSentCount}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={() => handleDelete(fall.id)}
                        data-testid={`button-delete-fall-${fall.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
