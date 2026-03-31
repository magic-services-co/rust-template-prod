'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [hexColor, setHexColor] = useState('#000000');
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (!value) {
      setHexColor('#000000');
      setOpacity(100);
      return;
    }

    if (value.startsWith('rgba')) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        setHexColor(`#${r}${g}${b}`);
        setOpacity(match[4] ? Math.round(parseFloat(match[4]) * 100) : 100);
      }
    } else if (value.startsWith('#')) {
      setHexColor(value);
      setOpacity(100);
    }
  }, [value]);

  const handleColorChange = (newHex: string) => {
    setHexColor(newHex);
    updateColor(newHex, opacity);
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    updateColor(hexColor, newOpacity);
  };

  const updateColor = (hex: string, op: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (op === 100) {
      onChange(hex);
    } else {
      const a = (op / 100).toFixed(2);
      onChange(`rgba(${r}, ${g}, ${b}, ${a})`);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      <div className="flex gap-2 items-center">
        <Input
          type="color"
          value={hexColor}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-16 h-9 cursor-pointer"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Slider
              value={[opacity]}
              onValueChange={(val) => handleOpacityChange(val[0])}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs font-mono w-10 text-right">{opacity}%</span>
          </div>
        </div>
      </div>
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., rgba(0,0,0,0.5) or #000000"
        className="text-xs font-mono"
      />
    </div>
  );
}
