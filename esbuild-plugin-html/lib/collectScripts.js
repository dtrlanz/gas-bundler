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

// This function is modified from the original implementation to load and inline code from modules
/**
 * @param {import('cheerio').CheerioAPI} $ The cheerio selector.
 * @param {import('cheerio').Cheerio<import('cheerio').Document>} dom The DOM element.
 * @param {import('cheerio').Element[]} elements List of nodes.
 * @param {string|string[]} target Build target.
 * @param {import('esbuild').Format} format Build format.
 * @param {string} type Script type.
 * @param {{ [key: string]: string }} attrs Script attrs.
 * @param {import('./index.js').BuildOptions} options Build options.
 * @param {import('./index.js').Helpers} helpers Helpers.
 * @returns {Promise<import('@chialab/esbuild-rna').OnTransformResult[]>} Plain build.
 */
async function innerCollect($, dom, elements, target, format, type, attrs = {}, options, helpers) {
    elements = elements
        .filter((element) => !$(element).attr('src') || isRelativeUrl($(element).attr('src')));

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
        const src = $(element).attr('src');
        if (src) {
            const resolvedFile = await helpers.resolve(src);
            if (!resolvedFile.path) {
                return;
            }

            builds.set(element, resolvedFile.pluginData === Build.RESOLVED_AS_FILE ? resolvedFile.path : src);
            entrypoints.set(resolvedFile.path, element);
        } else {
            const entryPoint = path.join(options.sourceDir, helpers.createEntry('js'));
            builds.set(element, {
                path: entryPoint,
                contents: $(element).html() || '',
            });
            entrypoints.set(entryPoint, element);
        }
    }));

    const result = await helpers.emitBuild({
        entryPoints: [...builds.values()],
        target,
        format: 'cjs',
    });

    const outputs = result.metafile.outputs;
    const styleFiles = Object.keys(outputs).filter((outName) => outName.endsWith('.css'));
    const promises = Object.entries(outputs).map(async ([outName, output]) => {
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

        const contents = await fsPromises.readFile(fullOutName);
        $(element).html(contents.toString('utf-8'));
        $(element).removeAttr('type').attr('type', 'application/javascript');
        for (const attrName in attrs) {
            $(element).removeAttr(attrName).attr(attrName, attrs[attrName]);
        }
    });
    await Promise.all(promises);

    if (styleFiles.length) {
        const script = $('<script>');
        for (const attrName in attrs) {
            $(script).attr(attrName, attrs[attrName]);
        }
        $(script).attr('type', type);
        $(script).html(`(function() {
function loadStyle(url) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = url;
    document.head.appendChild(l);
}

${styleFiles.map((outName) => {
            const fullOutFile = path.join(options.workingDir, outName);
            const outputPath = helpers.resolveRelativePath(fullOutFile, options.entryDir, '');
            return `loadStyle('${outputPath}');`;
        }).join('\n')}
}());`);
        dom.find('head').append(script);
    }

    return [result];
}

/**
 * Collect and bundle each <script> reference.
 * @type {import('./index').Collector}
 */
export async function collectScripts($, dom, options, helpers) {
    const moduleElements = dom.find('script[src][type="module"], script[type="module"]:not([src])').get();
    const nomoduleElements = dom.find('script[src]:not([type])[nomodule], script[src][type="text/javascript"][nomodule], script[src][type="application/javascript"][nomodule]').get();
    const scriptElements = dom.find('script[src]:not([type]):not([nomodule]), script[src][type="text/javascript"]:not([nomodule]), script[src][type="application/javascript"]:not([nomodule])').get();

    const results = [
        await innerCollect(
            $,
            dom,
            moduleElements,
            options.target[1],
            'esm',
            'module',
            {},
            options,
            helpers
        ),
    ];

    results.push(await innerCollect(
        $,
        dom,
        nomoduleElements,
        options.target[0],
        'iife',
        'application/javascript',
        { nomodule: '' },
        options,
        helpers
    ));

    results.push(await innerCollect(
        $,
        dom,
        scriptElements,
        options.target[0],
        'iife',
        'application/javascript',
        {},
        options,
        helpers
    ));

    return results.flat();
}
