"use client"

import { useMemo, useState } from "react"
import { MapVote } from "@/types/vote"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label, PieChart, Pie, Cell } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
} from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DiscordIcon } from "@/components/icons"

interface ViewMapVoteResultsProps {
    vote: MapVote
}

export function ViewMapVoteResults({ vote }: ViewMapVoteResultsProps) {
    const [open, setOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)

    const data = useMemo(() => {
        return vote.map_options.map((option, index) => ({
            name: `Map Option #${index + 1}`,
            votes: option.vote_count || 0,
            color: `hsl(var(--chart-${(index % 20) + 1}))`,
        }))
    }, [vote])

    const totalVotes = useMemo(() => {
        return vote.map_options.reduce((acc, curr) => acc + (curr.vote_count || 0), 0)
    }, [vote])

    const chartConfig: ChartConfig = useMemo(() => {
        const config: ChartConfig = {}
        vote.map_options.forEach((_option, index) => {
            config[`Map Option #${index + 1}`] = {
                color: `hsl(var(--chart-${(index % 20) + 1}))`,
            }
        })
        return config
    }, [vote])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                    View Results
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Map Vote Results</DialogTitle>
                    <DialogDescription>
                        The results of the map vote for <span className="text-primary font-bold">{vote.server?.server_name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[400px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent
                                        hideLabel
                                        className="w-36"
                                    />}
                                />
                                <Pie
                                    data={data}
                                    dataKey="votes"
                                    nameKey="name"
                                    innerRadius={60}
                                    strokeWidth={5}
                                >
                                    {data.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color}
                                            onClick={() => setSelectedOption(index)}
                                            className="cursor-pointer"
                                        />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {totalVotes.toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground"
                                                        >
                                                            Votes
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                                <ChartLegend
                                    content={({ payload }) => (
                                        <div className="grid grid-cols-2 place-items-center gap-2">
                                            {payload?.map((entry, index) => (
                                                <li key={`item-${index}`} className="flex items-center">
                                                    <span
                                                        className="mr-2 h-3 w-3 rounded-full"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    {entry.value}
                                                </li>
                                            ))}
                                        </div>
                                    )}
                                />
                            </PieChart>
                        </ChartContainer>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Vote Details</h3>
                        {selectedOption !== null ? (
                            <div className="space-y-2">
                                <h4 className="font-medium">Map Option #{selectedOption + 1}</h4>
                                <div className="space-y-2">
                                    {(vote.map_options[selectedOption]?.userVotes ?? []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No votes for this option.</p>
                                    ) : (
                                        (vote.map_options[selectedOption]?.userVotes ?? []).map((v, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={v.user?.image ?? undefined} />
                                                        <AvatarFallback>{v.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{v.user?.name ?? 'Unknown'}</div>
                                                        {v.user?.accounts?.[0]?.providerAccountId && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <DiscordIcon className="h-3 w-3" />
                                                                {v.user.accounts[0].providerAccountId}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant="secondary">×{v.multiplier ?? 1}</Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Click on a section of the pie chart to see who voted for that map option.</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
