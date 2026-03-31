import { Suspense } from "react";
import Content from "./content";
import { getMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return await getMetadata('terms-of-service');
}

export default function TermsPage() {
    return (
        <Suspense>
            <Content />
        </Suspense>
    );
}
