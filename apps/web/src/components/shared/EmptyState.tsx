import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="rounded-lg border border-border p-6">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 text-center text-muted-foreground">{description}</p>
        {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
      </CardContent>
    </Card>
  );
}
