// Original
// --------
// Copyright (c) 2021 Chialab

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Modifications
// -------------
// Copyright (c) 2023 Daniel Lanz

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as fsPromises from 'fs/promises';
import path from 'path';
import { isRelativeUrl } from '@chialab/node-resolve';
import { Build } from '@chialab/esbuild-rna';

/**
 * Collect and bundle each <link> reference.
 * @type {import('./index').Collector}
 */
export async function collectStyles($, dom, options, helpers) {
    const elements = dom
        .find('link[href][rel="stylesheet"], style')
        .get()
        .filter((element) => !$(element).attr('href') || isRelativeUrl($(element).attr('href')));

    if (!elements.length) {
        return [];
    }

    /**
     * @type {Map<import('cheerio').Element, import('@chialab/esbuild-rna').VirtualEntry|string>}
     */
    const builds = new Map();

    /**
     * @type {Map<string, import('cheerio').Element>}
     */
    const entrypoints = new Map();

    await Promise.all(elements.map(async (element) => {
        const href = $(element).attr('href');
        if (href) {
            const resolvedFile = await helpers.resolve(href);
            if (!resolvedFile.path) {
                return;
            }

            builds.set(element, resolvedFile.pluginData === Build.RESOLVED_AS_FILE ? resolvedFile.path : href);
            entrypoints.set(resolvedFile.path, element);
        } else {
            const entryPoint = path.join(options.sourceDir, helpers.createEntry('css'));
            builds.set(element, {
                path: entryPoint,
                contents: $(element).html() || '',
                loader: 'css',
            });
            entrypoints.set(entryPoint, element);
        }
    }));

    const result = await helpers.emitBuild({
        entryPoints: [...builds.values()],
        target: options.target[0],
    });

    for (const [outName, output] of Object.entries(result.metafile.outputs)) {
        if (outName.endsWith('.map')) {
            // ignore map files
            return;
        }
        if (!output.entryPoint) {
            // ignore chunks
            return;
        }

        const entryPoint = path.join(options.workingDir, output.entryPoint);
        const element = entrypoints.get(entryPoint);
        if (!element) {
            // unknown entrypoint
            return;
        }

        const fullOutName = path.join(options.workingDir, outName);
        const outputPath = helpers.resolveRelativePath(fullOutName, options.entryDir, '');
        if ($(element).is('link')) {
            $(element).attr('href', outputPath);
        } else {
            const contents = await fsPromises.readFile(fullOutName);
            $(element).html(contents.toString('utf-8'));
        }
    };

    return [result];
}
