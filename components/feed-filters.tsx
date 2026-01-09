"use client";

import { EVENT_CATEGORIES } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeedFiltersProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  postCount: number;
  eventCount: number;
}

export function FeedFilters({
  activeFilter,
  onFilterChange,
  postCount,
  eventCount,
}: FeedFiltersProps) {
  const filters = [
    { key: null, label: "Tout", count: postCount + eventCount },
    { key: "posts", label: "Posts", count: postCount },
    { key: "events", label: "Événements", count: eventCount },
  ];

  return (
    <div className="sticky top-16 z-10 bg-background border-b py-3 mb-6">
      <div className="max-w-2xl mx-auto">
        {/* Filtres principaux */}
        <div className="flex space-x-2 mb-3">
          {filters.map((filter) => (
            <Button
              key={filter.key || "all"}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.key)}
              className="flex items-center space-x-1"
            >
              <span>{filter.label}</span>
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Filtres par catégorie d'événements (uniquement si on filtre sur les événements) */}
        {activeFilter === "events" && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => onFilterChange(`event-${key}`)}
                className={`text-xs ${
                  activeFilter === `event-${key}`
                    ? "bg-blue-50 border-blue-200"
                    : ""
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
