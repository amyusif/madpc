import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  variant?: "default" | "blue" | "green" | "orange" | "red"
}

const variantStyles = {
  default: "border-border",
  blue: "border-l-4 border-l-primary bg-primary/5",
  green: "border-l-4 border-l-success bg-success/5",
  orange: "border-l-4 border-l-warning bg-warning/5",
  red: "border-l-4 border-l-destructive bg-destructive/5",
}

const iconStyles = {
  default: "text-muted-foreground",
  blue: "text-primary",
  green: "text-success",
  orange: "text-warning",
  red: "text-destructive",
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex-shrink-0">
            <Icon className={cn("w-8 h-8", iconStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}