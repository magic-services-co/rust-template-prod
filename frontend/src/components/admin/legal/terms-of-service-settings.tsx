"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save, PlusCircle, FileText, GripVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";

interface TermsSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

const termsSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type TermsSectionFormData = z.infer<typeof termsSectionSchema>;

const defaultSections: TermsSection[] = [
  {
    id: "intro",
    title: "Introduction",
    content: "These terms protect fair play, secure purchases, and a respectful environment for every player.",
    order: 0,
  },
  {
    id: "agreement-to-these-terms",
    title: "Agreement to these terms",
    content: "By accessing Magic Rust servers, our website, Discord community, or store, you agree to these Terms and our Privacy Policy. If you are not legally able to accept them, or do not agree with them, do not use the services.",
    order: 1,
  },
  {
    id: "accounts-access",
    title: "Accounts & access",
    content: "You are responsible for securing your linked Steam, Discord, and Magic Rust accounts. Do not share, sell, transfer, or permit access to account credentials. We may suspend access connected to compromised accounts, ban evasion, unauthorized software, or exploit activity.",
    order: 2,
  },
  {
    id: "store-purchases",
    title: "Store purchases",
    content: "Store products are digital benefits for use on Magic Rust services; they do not grant ownership of the server or its intellectual property. Benefits are normally delivered automatically after payment and are final except where required by law or approved by our support team.",
    order: 3,
  },
  {
    id: "server-conduct",
    title: "Server conduct",
    content: "Follow posted server rules and staff directions. Harassment, hate speech, cheating, exploiting, ban evasion, real-world trading, and deliberate service disruption are prohibited. Enforcement can include warnings, removal of benefits, suspensions, or permanent bans.",
    order: 4,
  },
  {
    id: "liability-changes",
    title: "Liability & changes",
    content: "Services are provided on an “as available” basis and may be modified, paused, or discontinued to protect community integrity. We may update these Terms at any time; continued use after a change takes effect accepts the revised Terms. Material changes will be announced through official channels where practicable.",
    order: 5,
  },
];

export function TermsOfServiceSettings() {
  const [sections, setSections] = useState<TermsSection[]>(defaultSections);
  const [selectedSection, setSelectedSection] = useState<TermsSection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TermsSectionFormData>({
    resolver: zodResolver(termsSectionSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTermsOfService();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      form.setValue("title", selectedSection.title);
      form.setValue("content", selectedSection.content);
    } else {
      form.reset();
    }
  }, [selectedSection, form]);

  const loadTermsOfService = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      const token = getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(backendApi("admin/settings/terms-of-service"), { credentials: 'include', headers });
      if (response.ok) {
        const data = await response.json();
        setSections(data);
      } else {
        toast.error("Failed to load Terms of Service content");
      }
    } catch (error) {
      toast.error("Failed to load Terms of Service content");
    } finally {
      setIsLoading(false);
    }
  };

  const saveTermsOfService = async (sectionsToSave: TermsSection[]) => {
    setIsSaving(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(backendApi("admin/settings/terms-of-service"), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ sections: sectionsToSave }),
      });

      if (response.ok) {
        const newSections = await response.json();
        const currentSelectedOrder = selectedSection?.order;
        setSections(newSections);
        toast.success("Terms of Service updated successfully");
        if (currentSelectedOrder !== undefined) {
            const newSelectedSection = newSections.find((s: TermsSection) => s.order === currentSelectedOrder);
            setSelectedSection(newSelectedSection || null);
        }
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err?.error || "Failed to update Terms of Service");
      }
    } catch (error) {
      toast.error("Failed to update Terms of Service");
    } finally {
      setIsSaving(false);
    }
  };

  const onFormSubmit = (data: TermsSectionFormData) => {
    if (!selectedSection) return;

    const updatedSections = sections.map(section =>
      section.id === selectedSection.id
        ? { ...section, title: data.title, content: data.content }
        : section
    );
    setSections(updatedSections);
    setSelectedSection({ ...selectedSection, title: data.title, content: data.content });
    saveTermsOfService(updatedSections);
  };

  const addNewSection = () => {
    const newSection: TermsSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      content: "",
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection);
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(section => section.id !== sectionId);
    setSections(updatedSections);
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
    saveTermsOfService(updatedSections);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && sections) {
      const oldIndex = sections.findIndex((section: TermsSection) => section.id === active.id);
      const newIndex = sections.findIndex((section: TermsSection) => section.id === over?.id);

      const newOrder = arrayMove(sections, oldIndex, newIndex);
      
      const updatedSections = newOrder.map((section, index) => ({
        ...section,
        order: index
      }));

      setSections(updatedSections);
      saveTermsOfService(updatedSections);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <Card className="w-1/4 mr-4">
        <CardHeader>
          <CardTitle>Terms Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map(section => ({ id: section.id }))}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                <Button onClick={addNewSection} variant="outline" className="mb-4 w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
                {sections.map((section) => (
                  <SortableTermsSection
                    key={section.id}
                    section={section}
                    isSelected={selectedSection?.id === section.id}
                    onSelect={() => setSelectedSection(section)}
                    onDelete={() => deleteSection(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card className="w-3/4">
        <CardHeader>
          <CardTitle>Terms of Service Content</CardTitle>
          <CardDescription>
            {selectedSection 
              ? `Editing: ${selectedSection.title}`
              : "Select a section to edit its content"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedSection ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a section from the list to edit its content</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SortableTermsSection({ 
  section, 
  isSelected, 
  onSelect, 
  onDelete 
}: { 
  section: TermsSection; 
  isSelected: boolean; 
  onSelect: () => void; 
  onDelete: () => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`w-full flex items-center px-2 cursor-pointer rounded-md ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}`}
      onClick={onSelect}
    >
      <div className="flex-grow flex items-center min-w-0">
        <div {...listeners} className="mr-2 cursor-move py-2">
          <GripVertical size={16} />
        </div>
        <span className="truncate">{section.title}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        Delete
      </Button>
    </div>
  );
} 