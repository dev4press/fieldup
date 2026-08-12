# FieldUp

FieldUp is a passive, accessible multi-file upload field. Files remain in the browser while selected and are sent only when the containing `multipart/form-data` form is submitted. Selecting or dropping files does not make an upload request.

## Install

```sh
npm install field-up
```

## Quick start

Use the file input inside a multipart form and add `data-field-up` so it is found by `FieldUp.mountAll()`:

```html
<form method="post" action="upload.php" enctype="multipart/form-data">
  <input type="file" name="files[]" multiple data-field-up>
  <button type="submit">Submit files</button>
</form>
<link rel="stylesheet" href="node_modules/field-up/dist/field-up.css">
<script type="module">
  import { FieldUp } from 'field-up';

  FieldUp.mountAll();
</script>
```

Accepted files are submitted with the form. Invalid files are shown as removable error cards and are excluded from submission. The associated form must use `enctype="multipart/form-data"`; otherwise initialization fails without modifying the input.

For the complete setup and configuration reference, see [documentation.md](documentation.md). It covers options, data attributes, JSON configuration, events, actions, browser scripts, and server-side integration. The [demo](demo/index.html) includes a small PHP upload handler.

## Local development

```sh
npm install
npm test
npm run build
```

The package publishes `dist/field-up.js` as an ES module and `dist/field-up.umd.js` as a browser-compatible UMD bundle.