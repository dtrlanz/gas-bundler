import esbuild from 'esbuild';

import { htmlPlugin } from "../lib/html-plugin.js";



await esbuild.build({
    entryPoints: ['src/tests/page.html'],
    outdir: 'src/tests/out',
    assetNames: 'assets/[name]-[hash]',
    chunkNames: '[ext]/[name]-[hash]',
    bundle: true,
    plugins: [
        htmlPlugin,
    ],
});