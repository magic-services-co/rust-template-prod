import MapViewContainer from "@/components/maps/map/map-view-container";
import { getMetadata } from "@/lib/metadata";
import { backendApi } from "@/lib/api";

type MapsPageTheme = {
    backgroundColor?: string;
    blurIntensity?: number;
    [key: string]: unknown;
};

export async function generateMetadata() {
    return await getMetadata('maps');
}

export default async function MapsViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = await params;
    const id = typeof rawId === "string" ? rawId : "";
    const res = await fetch(backendApi("data?include=themeSettings,pageTheme:maps"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const pageTheme = data.pageTheme;
    const rawSettings = pageTheme && "settings" in pageTheme ? pageTheme.settings : null;
    const settings = typeof rawSettings === "string" ? (() => { try { return JSON.parse(rawSettings); } catch { return {}; } })() : rawSettings;
    const theme: MapsPageTheme | undefined = settings && typeof settings === "object" ? (settings as { maps?: MapsPageTheme }).maps : undefined;

    if (!id) {
        return (
            <div className="container mx-auto py-8 pt-40 text-center">
                <p className="text-destructive">Invalid map vote link.</p>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen"
            style={{ 
                backgroundColor: theme?.backgroundColor ?? "transparent",
                backdropFilter: theme?.blurIntensity ? `blur(${theme.blurIntensity * 10}px)` : undefined
            }}
        >
            <div className="container mx-auto py-8 pt-40">
                <MapViewContainer id={id} theme={theme} />
            </div>
        </div>
    )
}