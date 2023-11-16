// @ts-ignore Could not find a declaration file for module
import htmlPluginFactory from "../../esbuild-plugin-html/lib/index.js";

/**
 * An HTML loader for esbuild that inlines modules to allow their use in Google Apps Script
 * @type esbuild plugin
 */
export const htmlPlugin = htmlPluginFactory();
