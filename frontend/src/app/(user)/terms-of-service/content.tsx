"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const NAVBAR_HEIGHT = 100; 

interface Section {
    id: string;
    title: string;
    content: string;
    order: number;
}

export default function Content() {
    const searchParams = useSearchParams();
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const { backendApi } = await import('@/lib/api');
                const response = await fetch(backendApi('legal/terms-of-service'));
                if (response.ok) {
                    const data = await response.json();
                    setSections(data);
                }
            } catch (error) {
                console.error("Failed to fetch terms sections", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSections();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            const hash = searchParams.get("section");
            if (hash) {
                const element = document.getElementById(hash);
                if (element) {
                    setTimeout(() => {
                        const elementPosition = element.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - NAVBAR_HEIGHT;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });
                    }, 100);
                }
            }
        }
    }, [searchParams, isLoading]);

    return (
        <div className="container pt-40">
            <div className="flex flex-col items-center pb-8 text-center">
                <h1 className="mt-2 text-center text-4xl font-bold">Terms of Service</h1>
                <p className="max-w-[80ch] bg-transparent px-8 text-center leading-8 text-muted-foreground">
                    Review our terms and conditions.
                </p>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="pb-5 space-y-8 text-muted-foreground">
                    {sections.map(section => (
                        <div key={section.id} className="space-y-2.5">
                            <h2 id={section.id} className="text-2xl text-foreground font-bold">
                                <Link href={`?section=${section.id}`} dangerouslySetInnerHTML={{ __html: section.title }} />
                            </h2>
                            <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: section.content }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}