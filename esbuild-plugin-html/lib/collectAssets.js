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

import { isRelativeUrl } from '@chialab/node-resolve';

/**
 * @param {import('cheerio').CheerioAPI} $ The cheerio selector.
 * @param {import('cheerio').Cheerio<import('cheerio').Element>} element The DOM element.
 * @param {string} attribute The element attribute to load.
 * @param {import('./index.js').BuildOptions} options Build options.
 * @param {import('./index.js').Helpers} helpers Helpers.
 * @returns {Promise<import('@chialab/esbuild-rna').OnTransformResult|void>} Plain build.
 */
export async function collectAsset($, element, attribute, options, helpers) {
    const resolvedFile = await helpers.resolve(/** @type {string} */ (element.attr(attribute)));
    if (!resolvedFile.path) {
        return;
    }

    const entryPoint = resolvedFile.path;
    const file = await helpers.emitFile(entryPoint);
    const outputPath = helpers.resolveRelativePath(file.path, null, '');
    element.attr(attribute, outputPath);

    return {
        ...file,
        watchFiles: [entryPoint],
    };
}

/**
 * Collect and bundle each node with a src reference.
 * @type {import('./index').Collector}
 */
export async function collectAssets($, dom, options, helpers) {
    const builds = await Promise.all([
        ...dom
            .find('[src]:not(script)')
            .get()
            .filter((element) => isRelativeUrl($(element).attr('src')))
            .map((element) => collectAsset($, $(element), 'src', options, helpers)),
        ...dom
            .find('link[href]:not([rel="stylesheet"]):not([rel="manifest"]):not([rel*="icon"]):not([rel*="apple-touch-startup-image"]), a[download][href], iframe[href]')
            .get()
            .filter((element) => isRelativeUrl($(element).attr('href')))
            .map((element) => collectAsset($, $(element), 'href', options, helpers)),
    ]);

    return /** @type {import('@chialab/esbuild-rna').OnTransformResult[]} */ (builds.filter((build) => !!build));
}
