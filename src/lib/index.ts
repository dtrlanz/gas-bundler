import esbuild from 'esbuild';
import { htmlPlugin } from "./html-plugin.js";
import { assignGlobal } from "./plugin-assign-global.js";

export async function build(options: esbuild.BuildOptions) {
    await esbuild.build({
        ...options,
        assetNames: 'tmp/assets/[name]-[hash]',
        chunkNames: 'tmp/[ext]/[name]-[hash]',
        bundle: true,
        format: 'cjs',
        plugins: [
            htmlPlugin
        ],
    });
}

