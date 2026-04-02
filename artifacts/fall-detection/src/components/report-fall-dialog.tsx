import { useState } from "react";
import { useReportFall, getListFallsQueryKey, getGetFallsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReportFallDialog() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reportFall = useReportFall();

  const handleReport = () => {
    reportFall.mutate(
      { data: { location: location || undefined, notes: notes || undefined } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListFallsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFallsSummaryQueryKey() });
          setResults(data.smsResults);
          toast({
            title: "Fall reported successfully",
            description: "Emergency contacts have been notified.",
            variant: "destructive",
          });
        },
        onError: () => {
          toast({
            title: "Error reporting fall",
            description: "Please try again immediately or contact emergency services manually.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const resetAndClose = () => {
    setOpen(false);
    setTimeout(() => {
      setLocation("");
      setNotes("");
      setResults(null);
      reportFall.reset();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          variant="destructive" 
          className="w-full text-lg h-16 shadow-xl animate-pulse font-bold"
          data-testid="button-report-fall"
        >
          <AlertCircle className="mr-2 h-6 w-6" />
          REPORT FALL NOW
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {!results ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2 text-xl">
                <AlertCircle className="h-6 w-6" />
                Report Emergency Fall
              </DialogTitle>
              <DialogDescription>
                This will immediately send SMS alerts to all active emergency contacts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g. Living Room, Bathroom"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  data-testid="input-fall-location"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Needs immediate ambulance"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="input-fall-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-report">
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReport} 
                disabled={reportFall.isPending}
                data-testid="button-confirm-report"
              >
                {reportFall.isPending ? "Sending Alerts..." : "Trigger Alerts"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Alerts Sent
              </DialogTitle>
              <DialogDescription>
                The fall event has been logged and contacts have been notified.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[300px] overflow-y-auto space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                SMS Delivery Status
              </h4>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts configured to receive alerts.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      data-testid={`sms-result-${idx}`}
                    >
                      <div>
                        <p className="font-medium text-sm">{result.contactName}</p>
                        <p className="text-xs text-muted-foreground">{result.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <span className="flex items-center text-xs font-medium text-green-600 gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Sent
                          </span>
                        ) : (
                          <span className="flex items-center text-xs font-medium text-destructive gap-1">
                            <XCircle className="h-4 w-4" /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={resetAndClose} data-testid="button-close-report-results">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
