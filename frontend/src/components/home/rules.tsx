"use client";

import { useState, useEffect } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface Rule {
    title: string;
    content: string;
}

interface RulesProps {
    rules?: Rule[];
}

export default function Rules({ rules }: RulesProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        if (!rules || rules.length === 0) {
            return (
                <div className="rounded-md border border-border/15 bg-accent/5 overflow-hidden">
                    <div className="flex flex-1 items-center justify-between py-4 px-4 font-medium bg-accent/15">
                        No Rules Configured
                    </div>
                    <div className="overflow-hidden text-sm px-4 pt-4 pb-4 bg-accent/5">
                        Please configure the server rules in the admin panel.
                    </div>
                </div>
            );
        }
        return (
            <div className="rounded-md border border-border/15 overflow-hidden space-y-0">
                {rules.map((rule, index) => (
                    <div key={`item-${index}`} className="border-b border-border/15 last:border-b-0">
                        <div className="flex flex-1 items-center justify-between py-4 px-4 font-medium bg-accent/15">
                            {rule.title}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!rules || rules.length === 0) {
        return (
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>No Rules Configured</AccordionTrigger>
                    <AccordionContent>
                        Please configure the server rules in the admin panel.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );
    }

    return (
        <Accordion type="single" collapsible>
            {rules.map((rule, index) => (
                <AccordionItem key={`item-${index}`} value={`item-${index}`}>
                    <AccordionTrigger>{rule.title}</AccordionTrigger>
                    <AccordionContent>
                        {rule.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}