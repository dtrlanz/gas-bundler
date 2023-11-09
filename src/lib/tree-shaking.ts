export function preventTreeShaking(...features: any[]) {
    // assign to a global dummy variable to prevent tree shaking
    (globalThis as any).__preventTreeShaking = features;
}