import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ClientServerPageContentDynamic } from "@/components/server-page-content-dynamic";
import { backendApi } from "@/lib/api";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const include = `redirect:/${slug},serverPage::${slug}`;
    const res = await fetch(backendApi(`data?include=${encodeURIComponent(include)}`), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const redirectRecord = data.redirect?.destination ? { destination: data.redirect.destination, permanent: data.redirect.permanent } : null;
    if (redirectRecord) return { title: "Redirecting..." };
    const page = data.serverPage;
    if (!page || !page.enabled) return { title: "Page Not Found" };
    return { title: page.title, description: `Custom page: ${page.title}` };
}

export default async function GeneralPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const include = `redirect:/${slug},serverPage::${slug}`;
    const res = await fetch(backendApi(`data?include=${encodeURIComponent(include)}`), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const redirectRecord = data.redirect?.destination ? { destination: data.redirect.destination, permanent: data.redirect.permanent } : null;
    if (redirectRecord) redirect(redirectRecord.destination);
    const page = data.serverPage;
    if (!page || !page.enabled) notFound();

    return (
        <div className="container pt-40 pb-20">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-center text-foreground">{page.title}</h1>
                <ClientServerPageContentDynamic content={page.content} />
            </div>
        </div>
    );
}
