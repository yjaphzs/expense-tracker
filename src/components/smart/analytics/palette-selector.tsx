"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PIE_COLOR_PALETTES } from "./config";

// --- Color Palette Selector ---
export function PaletteSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex w-full items-center gap-3 sm:w-auto">
            <span className="w-14 shrink-0 text-sm text-muted-foreground sm:w-auto">Colors:</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="flex-1 max-md:h-10 sm:w-[200px] sm:flex-none" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(PIE_COLOR_PALETTES).map(([key, palette]) => (
                        <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {palette.colors.slice(0, 5).map((c, i) => (
                                        <span
                                            key={i}
                                            className="inline-block size-2.5 rounded-full"
                                            style={{ background: c }}
                                        />
                                    ))}
                                </div>
                                {palette.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
