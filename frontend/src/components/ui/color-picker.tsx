'use client';

import { forwardRef, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import { useForwardedRef } from '@/hooks/use-forwarded-ref';
import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

function normalizeHex(value: string | null | undefined, defaultHex = '#FFFFFF'): string {
    if (value === null || value === undefined) return defaultHex;
    const s = String(value).trim();
    if (/^#([A-Fa-f0-9]{6})$/.test(s)) return s;
    if (/^([A-Fa-f0-9]{6})$/.test(s)) return '#' + s;
    return defaultHex;
}

interface ColorPickerProps {
    value?: string | null;
    onChange: (value: string) => void;
    onBlur?: () => void;
}

const ColorPicker = forwardRef<
    HTMLInputElement,
    Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(
    (
        { disabled, value, onChange, onBlur, name, className, ...props },
        forwardedRef
    ) => {
        const ref = useForwardedRef(forwardedRef);
        const [open, setOpen] = useState(false);

        const parsedValue = useMemo(
            () => normalizeHex(value, '#FFFFFF'),
            [value]
        );

        const handleInputChange = (raw: string) => {
            onChange(normalizeHex(raw, '#FFFFFF'));
        };

        return (
            <Popover onOpenChange={setOpen} open={open}>
                <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
                    <Button
                        {...props}
                        className={cn('block w-full max-w-32', className)}
                        name={name}
                        onClick={() => {
                            setOpen(true);
                        }}
                        size='icon'
                        style={{
                            backgroundColor: parsedValue,
                        }}
                        variant='outline'
                    >
                        {/* <div /> */}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full space-y-2.5'>
                    <HexColorPicker
                        color={parsedValue}
                        onChange={onChange}
                        className='w-full rounded-md overflow-hidden'
                    />
                    <Input
                        maxLength={7}
                        onChange={(e) => handleInputChange(e?.currentTarget?.value ?? '')}
                        ref={ref}
                        value={parsedValue}
                        className='w-full'
                    />
                </PopoverContent>
            </Popover>
        );
    }
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };