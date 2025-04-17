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
import { createLink } from "@/lib/api";
import type { FileType, LinkType } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy } from "lucide-react";

const formSchema = z.object({
  expiryIn: z.string(),
  password: z.string().optional(),
  downloadLimit: z.coerce.number().int().min(0).optional(),
  viewLimit: z.coerce.number().int().min(0).optional(),
  allowDownload: z.boolean().default(true),
  requireIdentification: z.boolean().default(false),
});

// Update the type definition for the form
type FormValues = z.infer<typeof formSchema>;

interface CreateLinkDialogProps {
  file: FileType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkCreated: (link: LinkType) => void;
}

export function CreateLinkDialog({
  file,
  open,
  onOpenChange,
  onLinkCreated,
}: CreateLinkDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<LinkType | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Add validation for the file object in the CreateLinkDialog component
  // At the beginning of the component function, add:
  if (!file || !file.fileId) {
    console.error("Invalid file object passed to CreateLinkDialog:", file);
    // Return a fallback UI or close the dialog
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Invalid file data. Please try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Then update the useForm call to use the FormValues type
  const form = useForm<FormValues>({
    // @ts-ignore
    resolver: zodResolver(formSchema),
    defaultValues: {
      expiryIn: "7d",
      password: "",
      downloadLimit: 0,
      viewLimit: 0,
      allowDownload: true,
      requireIdentification: false,
    },
  });

  // Update the onSubmit function signature
  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const linkData = await createLink({
        fileId: file.fileId,
        expiryIn: values.expiryIn,
        password: values.password || undefined,
        downloadLimit: values.downloadLimit || undefined,
        viewLimit: values.viewLimit || undefined,
        allowDownload: values.allowDownload,
        requireIdentification: values.requireIdentification,
      });

      // Store the created link URL
      const baseUrl = window.location.origin;
      const publicUrl = `${baseUrl}/view/${linkData.shareableLink
        .split("/")
        .pop()}`;
      setCreatedLink(publicUrl);
      setLinkData(linkData);
      setShowForm(false);

      toast({
        title: "Link created",
        description: "Your file link has been created successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating link:", error);
      toast({
        variant: "destructive",
        title: "Link creation failed",
        description: "There was a problem creating your link.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const copyLinkToClipboard = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard.",
        variant: "default",
      });
    }
  };

  const handleDone = () => {
    if (linkData) {
      onLinkCreated(linkData);
    }
    onOpenChange(false);
    // Reset the state for next time
    setCreatedLink(null);
    setLinkData(null);
    setShowForm(true);
  };

  // Function to format the URL with ellipsis
  const formatUrl = (url: string | null) => {
    if (!url) return "";

    // Find the position of the UUID part (after the last slash)
    const lastSlashIndex = url.lastIndexOf("/");
    if (lastSlashIndex === -1) return url;

    // Get the base URL up to the UUID
    const baseUrl = url.substring(0, lastSlashIndex + 1);

    // Get the UUID part
    const uuid = url.substring(lastSlashIndex + 1);

    // Show first 20 characters of the UUID followed by ellipsis
    const displayLength = 20;
    if (uuid.length <= displayLength) return url;

    return `${baseUrl}${uuid.substring(0, displayLength)}....`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Reset state when dialog is closed
          setCreatedLink(null);
          setLinkData(null);
          setShowForm(true);
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {showForm ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Sharing Link</DialogTitle>
              <DialogDescription>
                Create a secure link to share your file: {file.fileName}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                // @ts-ignore
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                      <FormDescription>
                        When the link will expire
                      </FormDescription>
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
                      <FormLabel>Password (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Leave empty for no password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Add password protection to your link
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
                        <FormDescription>
                          Maximum downloads allowed
                        </FormDescription>
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
                    {isLoading ? "Creating..." : "Create Link"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create Sharing Link</DialogTitle>
              <DialogDescription>
                Create a secure link to share your file: {file.fileName}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-2 text-sm font-medium">
                Your link has been created:
              </p>
              <div className="flex items-center">
                <div className="rounded-md rounded-r-none bg-muted px-3 py-2 text-sm flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  {formatUrl(createdLink)}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyLinkToClipboard}
                  className="h-9 rounded-l-none rounded-r-md bg-muted hover:bg-muted/80 px-3"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy</span>
                </Button>
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button onClick={handleDone} className="mt-2">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
