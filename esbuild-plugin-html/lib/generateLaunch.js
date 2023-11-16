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

import Jimp from './generator.js';

/**
 * Generate launch screen image buffer.
 * @param {import('./generator').Image} image The base icon buffer.
 * @param {number} width The launch screen size.
 * @param {number} height The launch screen size.
 * @param {number} gutter The gutter size.
 * @param {import('@jimp/core').RGBA} background The background color to use.
 * @returns Launch screen buffer.
 */
export async function generateLaunch(image, width, height, gutter, background) {
    image = image.clone();

    const gutterAlpha = image.hasAlpha() && gutter || 0;
    const launchBackground = (() => {
        if (image.hasAlpha()) {
            return null;
        }
        const topLeftColor = image.getPixelColor(0, 0);
        const topRightColor = image.getPixelColor(image.bitmap.width - 1, 0);
        const bottomLeftColor = image.getPixelColor(0, image.bitmap.height - 1);
        const bottomRightColor = image.getPixelColor(image.bitmap.width - 1, image.bitmap.height - 1);
        if (topLeftColor === topRightColor &&
            topLeftColor === bottomLeftColor &&
            topLeftColor === bottomRightColor) {
            const color = Jimp.intToRGBA(topLeftColor);
            color.a = 1;
            return color;
        }
        return null;
    })() || background;
    const size = Math.round(Math.min(height / 6, width / 6)) - (gutterAlpha || 0);
    const color = `rgba(${launchBackground.r}, ${launchBackground.g}, ${launchBackground.b}, ${launchBackground.a})`;
    const launchBuffer = new Jimp(width, height, color);
    launchBuffer.composite(image.resize(size, size, 'bezierInterpolation'), (width - size) / 2, (height - size) / 2);
    return launchBuffer.getBufferAsync('image/png');
}
