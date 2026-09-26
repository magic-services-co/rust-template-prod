import { getMetadata } from "@/lib/metadata";
import { getServerSession } from "@/lib/get-server-session";
import AccountLinkStepper from "./link";
import { cookies } from "next/headers";
import { SupportPageShell } from "@/components/support/support-page-shell";
import { LinkTitles } from "@/components/link-titles";

export async function generateMetadata() {
  return await getMetadata("link");
}

export default async function LinkPage() {
    const session = await getServerSession();
    const cookieStore = await cookies();
    const linkStatus = cookieStore.get("discord_link_status")?.value as ("success" | "error") | undefined;

    return (
        <SupportPageShell>
            <LinkTitles />
            <div className="pt-10">
                <AccountLinkStepper user={session?.user} linkStatus={linkStatus ?? null} />
            </div>
        </SupportPageShell>
    );
}
