"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { StoreSaleForm } from "./store-sale-form";
import { StoreSettingsForm } from "./store-settings-form";

export function StoreSettings() {
    return (
        <Accordion type="single" defaultValue="store-settings" collapsible>
            <AccordionItem value="store-settings" className="data-[state=open]:bg-card">
                <AccordionTrigger>Store Settings</AccordionTrigger>
                <AccordionContent>
                    <StoreSettingsForm />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="store-sale" className="data-[state=open]:bg-card">
                <AccordionTrigger>Store Sale Settings</AccordionTrigger>
                <AccordionContent className="">
                    <StoreSaleForm />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}