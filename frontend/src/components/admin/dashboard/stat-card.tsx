import { LucideIcon } from "lucide-react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface StatCardProps {
    title: string
    value: string
    icon: LucideIcon
    subtitle?: string
}

export function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </CardContent>
        </Card>
    )
}
