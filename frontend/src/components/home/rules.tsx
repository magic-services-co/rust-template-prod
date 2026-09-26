"use client";

import { useState, useEffect } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { HomeCardCorners } from "@/components/home/home-card-corners";

export interface Rule {
    title: string;
    content: string;
}

interface RulesProps {
    rules?: Rule[];
    emptyTitle?: string;
    emptyBody?: string;
}

const itemClass = "home-rules-item border-0"
const triggerClass =
    "ghost home-rules-trigger bg-transparent px-5 text-[13px] font-medium tracking-[0.2px] hover:no-underline"
const contentClass = "home-rules-content px-5 text-[13px] leading-6"

function RulesShell({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="home-rules-shell relative overflow-visible"
            data-theme-field="rulesCardBackground"
            data-theme-label="Rules card fill"
        >
            {children}
            <HomeCardCorners color="var(--home-rules-corner, #ba9142)" show />
        </div>
    );
}

export default function Rules({
    rules,
    emptyTitle = "No Rules Configured",
    emptyBody = "Please configure the server rules in the admin panel.",
}: RulesProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        if (!rules || rules.length === 0) {
            return (
                <RulesShell>
                    <div className={itemClass}>
                        <div className="home-rules-trigger px-5 py-4 text-[13px] font-medium">{emptyTitle}</div>
                        <div className="home-rules-content border-t px-5 py-4 text-[13px] leading-6">{emptyBody}</div>
                    </div>
                </RulesShell>
            );
        }
        return (
            <RulesShell>
                {rules.map((rule, index) => (
                    <div key={`item-${index}`} className={itemClass}>
                        <div className="home-rules-trigger px-5 py-4 text-[13px] font-medium">{rule.title}</div>
                    </div>
                ))}
            </RulesShell>
        );
    }

    if (!rules || rules.length === 0) {
        return (
            <RulesShell>
                <Accordion type="single" collapsible className="home-rules">
                    <AccordionItem value="item-1" className={itemClass}>
                        <AccordionTrigger className={triggerClass}>{emptyTitle}</AccordionTrigger>
                        <AccordionContent className={contentClass}>{emptyBody}</AccordionContent>
                    </AccordionItem>
                </Accordion>
            </RulesShell>
        );
    }

    return (
        <RulesShell>
            <Accordion type="single" collapsible className="home-rules">
                {rules.map((rule, index) => (
                    <AccordionItem key={`item-${index}`} value={`item-${index}`} className={itemClass}>
                        <AccordionTrigger className={triggerClass}>{rule.title}</AccordionTrigger>
                        <AccordionContent className={contentClass}>{rule.content}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </RulesShell>
    )
}
