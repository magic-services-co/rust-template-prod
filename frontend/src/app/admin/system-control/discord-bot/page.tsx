import { Metadata } from "next"
import { DiscordBotControlPanel } from "@/components/admin/discord-bot-control-panel"

export const metadata: Metadata = {
    title: "Discord Bot",
    description: "Run and control the Linking Bot in Docker.",
}

export default function DiscordBotPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Discord Bot (Linking Bot)</h1>
            <DiscordBotControlPanel />
        </div>
    )
}
