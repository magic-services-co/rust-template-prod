import { Metadata } from "next";
import { backendApi } from "@/lib/api";
import { notFound } from "next/navigation";
import { ClientServerPageContentDynamic } from "@/components/server-page-content-dynamic";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ serverId: string; slug: string }>;
}): Promise<Metadata> {
    const { serverId, slug } = await params;
    const include = `serverPage:${serverId}:${slug}`;
    const res = await fetch(backendApi(`data?include=${encodeURIComponent(include)}`), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const page = data.serverPage;
    if (!page || !page.enabled) return { title: "Page Not Found" };
    return { title: `${page.title} - Server`, description: `Custom page: ${page.title}` };
}

export default async function ServerPage({
    params,
}: {
    params: Promise<{ serverId: string; slug: string }>;
}) {
    const { serverId, slug } = await params;
    const include = `serverPage:${serverId}:${slug}`;
    const res = await fetch(backendApi(`data?include=${encodeURIComponent(include)}`), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const page = data.serverPage;
    if (!page || !page.enabled) notFound();

    return (
        <div className="container pt-40 pb-20">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-center text-foreground">{page.title}</h1>
                <p className="text-muted-foreground mb-8 text-center">
                    Server
                </p>
                <ClientServerPageContentDynamic content={page.content} />
            </div>
        </div>
    );
}
