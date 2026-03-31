import { MapGridImagesSettings } from "@/components/admin/map-voting/map-grid-images-settings";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Grid Images",
    description: "Manage map grid images and retention.",
};

export default function GridImagesSettingsPage() {
    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold">Grid Images & Retention</h1>
            <p className="text-muted-foreground">
                Manage images in the <code className="rounded bg-muted px-1 text-xs">map-grids</code> folder and set
                retention for automatic cleanup.
            </p>
            <Suspense fallback={<div>Loading grid images settings...</div>}>
                <MapGridImagesSettings />
            </Suspense>
        </div>
    );
}
