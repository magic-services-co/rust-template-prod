export type PterodactylStartupVarKeys = {
    seed: string
    size: string
    customMapUrl: string
}

export const defaultPterodactylStartupVarKeys: PterodactylStartupVarKeys = {
    seed: 'WORLD_SEED',
    size: 'WORLD_SIZE',
    customMapUrl: 'MAP_URL',
}

export function normalizePterodactylStartupVarKeys(
    keys?: Partial<PterodactylStartupVarKeys> | null
): PterodactylStartupVarKeys {
    return {
        seed: keys?.seed?.trim() || defaultPterodactylStartupVarKeys.seed,
        size: keys?.size?.trim() || defaultPterodactylStartupVarKeys.size,
        customMapUrl: keys?.customMapUrl?.trim() || defaultPterodactylStartupVarKeys.customMapUrl,
    }
}
