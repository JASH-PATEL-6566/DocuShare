"use client"

import { useEffect, useState } from "react"
import { LinkList } from "@/components/link-list"
import { useToast } from "@/components/ui/use-toast"
import type { LinkType } from "@/types"
import { fetchLinks } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LinksPage() {
  const { toast } = useToast()
  const [links, setLinks] = useState<LinkType[]>([])
  const [filteredLinks, setFilteredLinks] = useState<LinkType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    async function loadLinks() {
      setIsLoading(true)
      try {
        const data = await fetchLinks()
        setLinks(data.links)
        setFilteredLinks(data.links)
      } catch (error) {
        console.error("Error loading links:", error)
        toast({
          variant: "destructive",
          title: "Error loading links",
          description: "There was a problem loading your shared links.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadLinks()
  }, [toast])

  useEffect(() => {
    let filtered = links

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((link) => link.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((link) => link.shareableLink.toLowerCase().includes(query))
    }

    setFilteredLinks(filtered)
  }, [searchQuery, statusFilter, links])

  const handleLinkDelete = (linkId: string) => {
    setLinks(links.filter((link) => link.linkId !== linkId))
    setFilteredLinks(filteredLinks.filter((link) => link.linkId !== linkId))
  }

  const handleLinkUpdate = (updatedLink: LinkType) => {
    setLinks(links.map((link) => (link.linkId === updatedLink.linkId ? updatedLink : link)))
    setFilteredLinks(filteredLinks.map((link) => (link.linkId === updatedLink.linkId ? updatedLink : link)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shared Links</h1>
        <p className="text-muted-foreground">Manage your file sharing links</p>
      </div>

      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search links..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <LinkList links={filteredLinks} onDelete={handleLinkDelete} onUpdate={handleLinkUpdate} />
      )}
    </div>
  )
}
