import { build } from "../lib/index.js";

await build({
    entryPoints: ['src/tests/server.ts', 'src/tests/client.html'],
    outdir: 'src/tests/out',
});