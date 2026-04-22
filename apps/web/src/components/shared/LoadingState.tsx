import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Carregando..." }: LoadingStateProps) {
  return (
    <Card className="rounded-lg border border-border p-6">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
