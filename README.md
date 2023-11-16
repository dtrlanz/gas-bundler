**GAS Bundler**

*A simple bundler for Google Apps Script*

---

## Rationale

Google Apps Script projects that serve HTML in any form (e.g., web apps, side panels) typically include these in the form of `.html` files. Client-side code typically has to be contained directly in these files or included from dedicated `.html` files with `<script>` tags (see [Separate HTML, CSS, and JavaScript](https://developers.google.com/apps-script/guides/html/best-practices#separate_html_css_and_javascript)). This setup has several drawbacks. In particular, it makes it more difficult to develop client-side code in Typescript, and it inhibits sharing code between server and client.

Moreover, Google Apps Script does not support ECMAScript Modules.

This package seeks to address those issues by using `esbuild` to bundle projects with approporiate default options and a customized HTML plugin that inlines client-side code.

## Usage

This bundler calls esbuild's `build` function to bundle Google Apps Script projects. However, instead of passing the project entry points, it separates them into server and client entry points based on file extension.

Client side entry points are bundled using a plugin that inlines ECMAScript Modules into `<script>` tags.

After installing the package, set up a build script `build.js`.

```
await build({
    entryPoints: ['src/server.ts', 'src/client.html'],
    outdir: 'out',
});
```

Then run it as follows:

```
node ./build.js
```

With the exception of `entryPoints`, all other options are passed directly to esbuild (potentially overriding defaults provided by this package). See the [esbuild documentation](https://esbuild.github.io/api/).

## Client-side scripts

The HTML loader will inline client-side scripts when bundling HTML files. These script tags must have the attribute `type="module"`.

For example, say you have the following file `client.html`:

```
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body>
    <script type="module">
        import { message } from './client-script.ts';
        console.log(message);
    </script>
  </body>
</html>
```

The relevant code would be contained in a file `client-script.ts` in the same folder:

```
export const message = 'Hello world';
```

## License

**GAS Bundler** is released under the [MIT](./LICENSE) license.