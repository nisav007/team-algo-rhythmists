import { useState } from "react";
import { useListContacts, useCreateContact, useDeleteContact, getListContactsQueryKey, getGetFallsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bell, Trash2, UserPlus, ShieldAlert, Smartphone, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(3, "Notification topic is required").regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens and underscores allowed"),
  relationship: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contacts() {
  const { data: contacts, isLoading } = useListContacts();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    createContact.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFallsSummaryQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({
            title: "Contact added",
            description: "They will receive instant alerts during fall events.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add contact. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to remove this contact?")) return;

    deleteContact.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFallsSummaryQueryKey() });
          toast({ title: "Contact removed" });
        },
      }
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Contacts</h1>
          <p className="text-muted-foreground mt-2">
            Manage who receives instant alerts when a fall is detected.
          </p>
        </header>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-contact">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>
                This person will be notified immediately when a fall is reported.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jane Doe" {...field} data-testid="input-contact-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. fall-alert-jane" {...field} data-testid="input-contact-phone" />
                      </FormControl>
                      <FormDescription className="text-xs leading-relaxed">
                        Choose a unique topic name (letters, numbers, hyphens only).
                        The contact must install the <strong>ntfy</strong> app (free) and subscribe to this topic to receive alerts.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Daughter, Neighbor" {...field} data-testid="input-contact-relationship" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createContact.isPending} data-testid="button-save-contact">
                    {createContact.isPending ? "Saving..." : "Save Contact"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Setup instructions banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 flex gap-4">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-blue-900">How to receive fall alerts (free, no subscription)</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>The concerned person installs the <strong>ntfy</strong> app on their phone — available on Android and iOS, completely free.</li>
            <li>Open the app and tap <strong>"Subscribe to topic"</strong>.</li>
            <li>Enter the <strong>exact notification topic</strong> you set for them below (e.g. <code className="bg-blue-100 px-1 rounded">fall-alert-jane</code>).</li>
            <li>When a fall is reported, they will instantly receive a high-priority alert on their phone.</li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : contacts?.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No contacts configured</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Add contacts to ensure someone is notified during an emergency.
            </p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>
              Add First Contact
            </Button>
          </div>
        ) : (
          contacts?.map((contact) => (
            <Card key={contact.id} data-testid={`card-contact-${contact.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                    {contact.relationship && (
                      <CardDescription className="mt-1">{contact.relationship}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 -mt-2 -mr-2"
                    onClick={() => handleDelete(contact.id)}
                    data-testid={`button-delete-contact-${contact.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete {contact.name}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">{contact.phone}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Smartphone className="h-3 w-3" />
                  <span>Subscribe in ntfy app to receive alerts</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
