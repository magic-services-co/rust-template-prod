'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export type ThemeEditorPageOption = { slug: string; label: string; path: string };

export function ThemeEditorPagePicker({
  pages,
  selectedSlug,
  onSelect,
  className,
}: {
  pages: ThemeEditorPageOption[];
  selectedSlug: string;
  onSelect: (page: ThemeEditorPageOption) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => pages.find((p) => p.slug === selectedSlug), [pages, selectedSlug]);
  const index = useMemo(() => pages.findIndex((p) => p.slug === selectedSlug), [pages, selectedSlug]);

  const goPrev = () => {
    if (pages.length === 0) return;
    const i = index <= 0 ? pages.length - 1 : index - 1;
    onSelect(pages[i]);
  };

  const goNext = () => {
    if (pages.length === 0) return;
    const i = index < 0 || index >= pages.length - 1 ? 0 : index + 1;
    onSelect(pages[i]);
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">Page</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={goPrev}
        title="Previous page"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 min-w-[140px] max-w-[min(100vw-12rem,280px)] justify-between px-3 font-normal"
            title="Open page list — type to search"
          >
            <span className="truncate">{selected?.label ?? 'Choose page'}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search pages…" />
            <CommandList>
              <CommandEmpty>No page found.</CommandEmpty>
              <CommandGroup heading="Pages">
                {pages.map((page) => (
                  <CommandItem
                    key={page.slug}
                    value={`${page.label} ${page.slug} ${page.path}`}
                    onSelect={() => {
                      onSelect(page);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn('h-4 w-4 shrink-0', selectedSlug === page.slug ? 'opacity-100' : 'opacity-0')}
                    />
                    <span className="truncate flex-1 min-w-0">{page.label}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[5.5rem] sm:max-w-[7rem]">
                      {page.path}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={goNext}
        title="Next page"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
