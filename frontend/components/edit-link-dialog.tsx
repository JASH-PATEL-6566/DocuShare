"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { updateLink } from "@/lib/api";
import type { LinkType } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  expiryIn: z.string(),
  password: z.string().optional(),
  downloadLimit: z.coerce.number().int().min(0).optional(),
  viewLimit: z.coerce.number().int().min(0).optional(),
  allowDownload: z.boolean().default(true),
  requireIdentification: z.boolean().default(false),
});

interface EditLinkDialogProps {
  link: LinkType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkUpdated: (link: LinkType) => void;
}

export function EditLinkDialog({
  link,
  open,
  onOpenChange,
  onLinkUpdated,
}: EditLinkDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Calculate days between now and expiry
  const daysToExpiry = () => {
    const now = new Date();
    const expiry = new Date(link.expiryTimestamp);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "24h";
    if (diffDays <= 3) return "3d";
    if (diffDays <= 7) return "7d";
    if (diffDays <= 14) return "14d";
    return "30d";
  };

  const form = useForm<z.infer<typeof formSchema>>({
    // @ts-ignore
    resolver: zodResolver(formSchema),
    defaultValues: {
      expiryIn: daysToExpiry(),
      password: "",
      downloadLimit: link.downloadLimit || 0,
      viewLimit: link.viewLimit || 0,
      allowDownload: link.allowDownload,
      requireIdentification: link.requireIdentification,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const updatedLink = await updateLink(link.linkId, {
        expiryIn: values.expiryIn,
        password: values.password || undefined,
        downloadLimit: values.downloadLimit || undefined,
        viewLimit: values.viewLimit || undefined,
        allowDownload: values.allowDownload,
        requireIdentification: values.requireIdentification,
      });

      onLinkUpdated(updatedLink);
      toast({
        title: "Link updated",
        description: "Your file link has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating link:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your link.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sharing Link</DialogTitle>
          <DialogDescription>
            Update your file sharing link settings
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* @ts-ignore */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              // @ts-ignore
              control={form.control}
              name="expiryIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Time</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiry time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="3d">3 days</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="14d">14 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>When the link will expire</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              // @ts-ignore
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password {link.hasPassword ? "(Change)" : "(Optional)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        link.hasPassword
                          ? "Enter new password"
                          : "Leave empty for no password"
                      }
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {link.hasPassword
                      ? "Leave empty to keep current password"
                      : "Add password protection to your link"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                // @ts-ignore
                control={form.control}
                name="downloadLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Download Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0 for unlimited"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Maximum downloads allowed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-ignore
                control={form.control}
                name="viewLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0 for unlimited"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Maximum views allowed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              // @ts-ignore
              control={form.control}
              name="allowDownload"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Allow Download</FormLabel>
                    <FormDescription>
                      Allow recipients to download the file
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              // @ts-ignore
              control={form.control}
              name="requireIdentification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Require Identification</FormLabel>
                    <FormDescription>
                      Require recipients to identify themselves
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
