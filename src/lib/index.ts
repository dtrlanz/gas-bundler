import esbuild from 'esbuild';
import { htmlPlugin } from "./html-plugin.js";

export async function build(options: esbuild.BuildOptions): Promise<void> {
    const server = buildServer({
        ...options,
        entryPoints: filterEntryPoints(options.entryPoints, s => !s.endsWith('.html')),
    });
    const client = buildClient({
        ...options,
        entryPoints: filterEntryPoints(options.entryPoints, s => s.endsWith('.html')),
    });
    await Promise.all([server, client]);
}

function filterEntryPoints(entryPoints: esbuild.BuildOptions['entryPoints'], predicate: (s: string) => boolean): esbuild.BuildOptions['entryPoints'] {
    if (!entryPoints) return entryPoints;
    if (Array.isArray(entryPoints)) {
        if (entryPoints.length === 0) return [];
        if (typeof entryPoints[0] === 'string') {
            return (entryPoints as string[]).filter(predicate);
        }
        return (entryPoints as { in: string, out: string }[]).filter(s => predicate(s.in));
    }
    const obj: Record<string, string> = {};
    for (const k in entryPoints) {
        if (predicate(k)) {
            obj[k] = entryPoints[k];
        }
    }
    return obj;
}

export async function buildServer(options: esbuild.BuildOptions) {
    await esbuild.build({
        assetNames: 'tmp/assets/[name]-[hash]',
        chunkNames: 'tmp/[ext]/[name]-[hash]',
        bundle: true,
        ...options,
    });
}

export async function buildClient(options: esbuild.BuildOptions) {
    await esbuild.build({
        assetNames: 'tmp/assets/[name]-[hash]',
        chunkNames: 'tmp/[ext]/[name]-[hash]',
        bundle: true,
        plugins: [htmlPlugin],
        ...options,
    });
}

