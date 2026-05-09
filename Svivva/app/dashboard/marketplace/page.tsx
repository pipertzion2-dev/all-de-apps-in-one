"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Search,
  Star,
  Download,
  DollarSign,
  TrendingUp,
  Sparkles,
  Filter,
} from "lucide-react";

interface MarketplaceListing {
  id: string;
  projectId: string;
  title: string;
  shortDescription: string | null;
  category: string;
  tags: string[];
  priceType: string;
  priceAmount: number | null;
  currency: string;
  totalPurchases: number;
  averageRating: number | null;
  reviewCount: number;
  featuredAt: string | null;
  createdAt: string;
  ownerName: string | null;
  ownerImage: string | null;
  projectName: string;
  projectSlug: string;
}

interface MarketplaceResponse {
  listings: MarketplaceListing[];
  total: number;
  limit: number;
  offset: number;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "writing", label: "Writing" },
  { value: "coding", label: "Coding" },
  { value: "analysis", label: "Analysis" },
  { value: "creative", label: "Creative" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
];

function formatPrice(priceType: string, amount: number | null): string {
  if (priceType === "free") return "Free";
  if (!amount) return "Free";
  return `$${(amount / 100).toFixed(2)}`;
}

function StarRating({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || count === 0) {
    return <span className="text-xs text-muted-foreground">No reviews</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
      <span className="text-sm font-medium">{(rating / 10).toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery<MarketplaceResponse>({
    queryKey: ["/api/marketplace", { search: searchQuery, category }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (category !== "all") params.set("category", category);

      const res = await fetch(`/api/marketplace?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch marketplace");
      return res.json();
    },
  });

  const handleSearch = () => {
    setSearchQuery(search);
  };

  const listings = data?.listings || [];
  const featuredListings = listings.filter((l) => l.featuredAt);
  const regularListings = listings.filter((l) => !l.featuredAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-marketplace-title">
          Marketplace
        </h1>
        <p className="text-muted-foreground">Discover and purchase pre-built AI APIs</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search APIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            data-testid="input-search"
          />
          <Button onClick={handleSearch} data-testid="button-search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48" data-testid="select-category">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No listings found</h3>
            <p className="text-muted-foreground">
              {searchQuery || category !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to list your API on the marketplace!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {featuredListings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Featured APIs</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} featured />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All APIs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regularListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>

          {data && data.total > listings.length && (
            <div className="text-center">
              <Button variant="outline" data-testid="button-load-more">
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  featured = false,
}: {
  listing: MarketplaceListing;
  featured?: boolean;
}) {
  return (
    <Card
      className={`hover-elevate cursor-pointer ${featured ? "border-yellow-500/50" : ""}`}
      data-testid={`card-listing-${listing.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{listing.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {listing.shortDescription || "No description"}
            </CardDescription>
          </div>
          {featured && (
            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shrink-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={listing.ownerImage || undefined} />
            <AvatarFallback>{listing.ownerName?.charAt(0) || "A"}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {listing.ownerName || "Anonymous"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            {listing.category}
          </Badge>
          {listing.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <StarRating rating={listing.averageRating} count={listing.reviewCount} />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3 w-3" />
            {listing.totalPurchases}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full flex items-center justify-between">
          <span className="font-bold text-lg">
            {formatPrice(listing.priceType, listing.priceAmount)}
          </span>
          <Button size="sm" data-testid={`button-view-${listing.id}`}>
            View API
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
