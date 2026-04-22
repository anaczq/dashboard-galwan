import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between bg-gradient-to-r from-primary to-secondary px-4 py-5 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary-foreground lg:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-primary-foreground/80">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
