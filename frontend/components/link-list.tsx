"use client";

import { useState } from "react";
import type { LinkType } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteLink, revokeLink, activateLink } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditLinkDialog } from "@/components/edit-link-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  MoreHorizontal,
  Trash,
  Link,
  Eye,
  Download,
  Lock,
  CheckCircle,
  XCircle,
  Edit,
  Play,
  Pause,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LinkListProps {
  links: LinkType[];
  onDelete: (linkId: string) => void;
  onUpdate: (link: LinkType) => void;
}

export function LinkList({ links, onDelete, onUpdate }: LinkListProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [selectedLink, setSelectedLink] = useState<LinkType | null>(null);
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);

  const handleCopyLink = (link: string) => {
    // Create the full URL for the public link
    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/view/${link.split("/").pop()}`;

    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard.",
      variant: "default",
    });
  };

  const handleDelete = async (linkId: string) => {
    setIsLoading((prev) => ({ ...prev, [linkId]: true }));
    try {
      await deleteLink(linkId);
      onDelete(linkId);
      toast({
        title: "Link deleted",
        description: "Your link has been deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting link:", error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "There was a problem deleting your link.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [linkId]: false }));
    }
  };

  const handleRevoke = async (linkId: string) => {
    setIsLoading((prev) => ({ ...prev, [linkId]: true }));
    try {
      await revokeLink(linkId);
      const foundLink = links.find((l) => l.linkId === linkId);
      if (foundLink) {
        // Create a new object with the updated status explicitly typed as "revoked"
        const updatedLink: LinkType = {
          ...foundLink,
          status: "revoked" as const,
        };
        onUpdate(updatedLink);
      }
      toast({
        title: "Link Deactivated",
        description: "Access to this link has been disabled.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error revoking link:", error);
      toast({
        variant: "destructive",
        title: "Revocation failed",
        description: "There was a problem revoking your link.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [linkId]: false }));
    }
  };

  const handleActivate = async (linkId: string) => {
    setIsLoading((prev) => ({ ...prev, [linkId]: true }));
    try {
      await activateLink(linkId);
      const foundLink = links.find((l) => l.linkId === linkId);
      if (foundLink) {
        // Create a new object with the updated status explicitly typed as "active"
        const updatedLink: LinkType = {
          ...foundLink,
          status: "active" as const,
        };
        onUpdate(updatedLink);
      }
      toast({
        title: "Link activated",
        description: "Your link has been activated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error activating link:", error);
      toast({
        variant: "destructive",
        title: "Activation failed",
        description: "There was a problem activating your link.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [linkId]: false }));
    }
  };

  const handleEdit = (link: LinkType) => {
    setSelectedLink(link);
    setIsEditLinkOpen(true);
  };

  const handleLinkUpdated = (link: LinkType) => {
    onUpdate(link);
    setIsEditLinkOpen(false);
    setSelectedLink(null);
  };

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Link className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No links found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create links to share your files.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Link</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Security</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => {
              const isExpired = new Date(link.expiryTimestamp) < new Date();
              const displayStatus = isExpired ? "expired" : link.status;

              return (
                <TableRow key={link.linkId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyLink(link.shareableLink)}
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy link</span>
                      </Button>
                      <span className="truncate max-w-[200px]">
                        {link.shareableLink}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(link.expiryTimestamp)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        displayStatus === "active"
                          ? "default"
                          : displayStatus === "revoked"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {displayStatus === "active" && (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      {displayStatus === "revoked" && (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {displayStatus === "expired" && (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {displayStatus.charAt(0).toUpperCase() +
                        displayStatus.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {link.hasPassword && (
                        <Badge variant="outline">
                          <Lock className="mr-1 h-3 w-3" />
                          Password
                        </Badge>
                      )}
                      {link.downloadLimit > 0 && (
                        <Badge variant="outline">
                          <Download className="mr-1 h-3 w-3" />
                          {link.downloadLimit}
                        </Badge>
                      )}
                      {link.viewLimit > 0 && (
                        <Badge variant="outline">
                          <Eye className="mr-1 h-3 w-3" />
                          {link.viewLimit}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopyLink(link.shareableLink)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(link)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {link.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() => handleRevoke(link.linkId)}
                            disabled={isLoading[link.linkId]}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Revoke
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleActivate(link.linkId)}
                            disabled={isLoading[link.linkId] || isExpired}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(link.linkId)}
                          disabled={isLoading[link.linkId]}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedLink && (
        <EditLinkDialog
          link={selectedLink}
          open={isEditLinkOpen}
          onOpenChange={setIsEditLinkOpen}
          onLinkUpdated={handleLinkUpdated}
        />
      )}
    </>
  );
}
