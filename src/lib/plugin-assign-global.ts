import textReplace from "esbuild-plugin-text-replace";

const find = /(?<prefix>^|\r)(?<commentLine>\s*\/\/s*@global)(?<infix>s*\rs*(?:exports+)?(?:async+)?functions+)(?<fnName>\S+)(?<suffix>s*\()/g;

function replace(_: string, prefix: string, commentLine: string, infix: string, fnName: string, suffix: string) {
    const margin = commentLine.substring(0, commentLine.length - commentLine.trimStart().length);
    return `${prefix}${commentLine}\r${margin}globalThis.${fnName} = ${fnName}${infix}${fnName}${suffix}`;
}

export const assignGlobal = textReplace({
    include: /(?:.js|.jsx|.ts|.tsx)/,
    pattern: [[find, replace]],
});
