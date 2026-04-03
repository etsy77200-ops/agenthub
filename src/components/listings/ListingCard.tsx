import Link from "next/link";
import type { Listing } from "@/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-muted ml-1">({rating})</span>
    </div>
  );
}

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listing/${listing.id}`} className="block group">
      <div className="border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-200 bg-card h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {listing.category?.name || "AI Agent"}
          </span>
          <span className="text-lg font-bold text-foreground">
            ${listing.price}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {listing.title}
        </h3>

        <p className="text-sm text-muted mb-4 line-clamp-2 flex-grow">
          {listing.short_description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {listing.seller?.name?.charAt(0) || "?"}
              </span>
            </div>
            <span className="text-sm text-muted">{listing.seller?.name}</span>
          </div>
          <StarRating rating={listing.rating} />
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted">
          <span>{listing.review_count} reviews</span>
          <span>{listing.order_count} orders</span>
        </div>
      </div>
    </Link>
  );
}
