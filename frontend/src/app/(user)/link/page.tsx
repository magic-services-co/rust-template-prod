import { getMetadata } from "@/lib/metadata";
import { getServerSession } from "@/lib/get-server-session";
import AccountLinkStepper from "./link";
import { backendApi } from "@/lib/api";
import { LinkedUsersCount } from "@/components/linked-users-count";
import { cookies } from "next/headers";

export async function generateMetadata() {
  return await getMetadata('link');
}

export default async function LinkPage() {
    const session = await getServerSession();
    const res = await fetch(backendApi("data?include=themeSettings"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const themeSettings = data.themeSettings;
    const cookieStore = await cookies();
    const linkStatus = cookieStore.get('discord_link_status')?.value as ('success' | 'error') | undefined;

    return (
        <div className="container mx-auto py-8 pt-32 flex flex-col items-center justify-center min-h-[80vh]">
            <h2 
              className="text-5xl font-extrabold mb-2 tracking-tight text-center"
              style={{ color: themeSettings?.primaryTitleColor || "#f8fafc" }}
            >
              Link Your Accounts
            </h2>
            <p 
              className="max-w-2xl text-center mb-6 text-base font-medium"
              style={{ color: themeSettings?.secondaryTextColor || "#8e9db1" }}
            >
               Join the rest of the community and link your account to get access to the full range of features.
            </p>
            <div className="mb-12">
                <LinkedUsersCount />
            </div>
            <AccountLinkStepper user={session?.user} linkStatus={linkStatus ?? null} />
        </div>
    )
}