# FieldUp documentation

## Basic use

Place a file input inside a `multipart/form-data` form and mount it. `FieldUp.mountAll()` mounts every `input[type="file"][data-field-up]`; `new FieldUp(input, options)` mounts one input.

```html
<form method="post" action="upload.php" enctype="multipart/form-data">
  <input type="file" name="files[]" multiple data-field-up>
</form>
<script type="module">
  import { FieldUp } from 'field-up';
  FieldUp.mountAll();
</script>
```

The component is passive: accepted files are kept in the native input and submitted with the form. Invalid files are displayed as removable error cards but are not submitted. FieldUp verifies that the associated form uses `multipart/form-data` before rendering; otherwise, the constructor throws an error and leaves the input unchanged. The demo includes `demo/upload.php` as a small local upload handler.

## Browser script and WordPress use

When `import` is not available, load `dist/field-up.umd.js` with a regular script tag. The UMD bundle creates the `window.FieldUp` namespace, whose `FieldUp` property is the exported class:

```html
<link rel="stylesheet" href="/path/to/field-up.css">
<script src="/path/to/field-up.umd.js"></script>
<script>
  window.FieldUp.FieldUp.mountAll();
</script>
```

The markup is the same as for the module build. Add `data-field-up` to each file input that should be mounted, and make sure its form uses `enctype="multipart/form-data"`.

For a WordPress plugin, enqueue the distributed files and initialize the fields after the UMD script:

```php
function my_plugin_enqueue_field_up() {
    $url = plugin_dir_url(__FILE__) . 'vendor/field-up/dist/';

    wp_enqueue_style(
        'field-up',
        $url . 'field-up.css',
        [],
        '0.9.0'
    );
    wp_enqueue_script(
        'field-up',
        $url . 'field-up.umd.js',
        [],
        '0.9.0',
        true
    );
    wp_add_inline_script(
        'field-up',
        'window.FieldUp.FieldUp.mountAll();'
    );
}
add_action('wp_enqueue_scripts', 'my_plugin_enqueue_field_up');
```

Then render a normal multipart form in the page or shortcode output:

```html
<form method="post" enctype="multipart/form-data">
  <input type="file" name="files[]" multiple data-field-up>
  <button type="submit">Submit files</button>
</form>
```

If the scripts are loaded in the document head instead of the footer, wrap the initializer in `DOMContentLoaded` so the file inputs exist before `mountAll()` runs.

## Options

The following table lists every configuration option. The **data attribute** column is the equivalent `data-*` spelling for an individual setting. Individual attributes take priority over `data-options`, which takes priority over the JavaScript initialization object.

| JavaScript option | Data attribute | Required format | Default | Description | JavaScript example | Data attribute example |
| --- | --- | --- | --- | --- | --- | --- |
| `maxFiles` | `data-max-files` | Non-negative integer; `0` means no limit | `4` | Maximum number of valid files that can be selected. | `maxFiles: 8` | `data-max-files="8"` |
| `maxFileSize` | `data-max-file-size` | Bytes, non-negative integer; `0` means no limit | `2097152` | Maximum allowed size for each file. | `maxFileSize: 10485760` | `data-max-file-size="10485760"` |
| `totalFileSizeAllowed` | `data-total-file-size-allowed` | Bytes, positive integer; `0` means no limit | `null` | Maximum combined size of all valid files. | `totalFileSizeAllowed: 52428800` | `data-total-file-size-allowed="52428800"` |
| `allowedFileTypes` | `data-allowed-file-types` | JS array or comma-separated MIME/extensions | Input `accept`, then all types | File MIME types or extensions accepted by validation. | `allowedFileTypes: ['image/*', '.pdf']` | `data-allowed-file-types="image/*,.pdf"` |
| `captionName` | `data-caption-name` | Non-empty field name | `file_captions[]` | Name of the submitted form field containing file captions. | `captionName: 'captions'` | `data-caption-name="captions"` |
| `wrapperClass` | `data-wrapper-class` | CSS class string | `''` | Additional CSS class applied to the component wrapper. | `wrapperClass: 'compact'` | `data-wrapper-class="compact"` |
| `startCollapsed` | `data-start-collapsed` | Boolean | `false` | Whether the component starts in its collapsed state. | `startCollapsed: true` | `data-start-collapsed="true"` |
| `startCollapsedButtonLabel` | `data-start-collapsed-button-label` | String | `Upload Files` | Accessible label for the button that expands a collapsed component. | `startCollapsedButtonLabel: 'Add files'` | `data-start-collapsed-button-label="Add files"` |
| `disableDropZone` | `data-disable-drop-zone` | Boolean | `false` | Removes the drop-zone box and leaves only the browse control and file limits. | `disableDropZone: true` | `data-disable-drop-zone="true"` |
| `dropAreaTitleText` | `data-drop-area-title-text` | String | `Choose files to upload` | Main text displayed in the drop zone title. | `dropAreaTitleText: 'Choose media'` | `data-drop-area-title-text="Choose media"` |
| `dropAreaHintText` | `data-drop-area-hint-text` | String | `or drag and drop them here` | Supporting text that explains drag-and-drop behavior. | `dropAreaHintText: 'Drop images here'` | `data-drop-area-hint-text="Drop images here"` |
| `dropAreaIcon` | `data-drop-area-icon` | SVG/HTML string | Built-in upload icon | Icon markup displayed in the drop zone. | `dropAreaIcon: '<svg>...</svg>'` | `data-drop-area-icon="<svg>...</svg>"` |
| `browseButtonLabel` | `data-browse-button-label` | String | `Browse files` | Visible and accessible label for the file browser button. | `browseButtonLabel: 'Select files'` | `data-browse-button-label="Select files"` |
| `browseButtonIcon` | `data-browse-button-icon` | SVG/HTML string | Built-in upload icon | Icon markup displayed inside the browse button. | `browseButtonIcon: '<svg>...</svg>'` | `data-browse-button-icon="<svg>...</svg>"` |
| `selectedFilesTitleText` | `data-selected-files-title-text` | String | `Selected files` | Text used as the accessible heading for the list of valid and invalid selected files. | `selectedFilesTitleText: 'Files to send'` | `data-selected-files-title-text="Files to send"` |
| `noFilesSelectedText` | `data-no-files-selected-text` | String | `No files selected yet.` | Empty-state text shown when no file cards are present. | `noFilesSelectedText: 'Nothing selected.'` | `data-no-files-selected-text="Nothing selected."` |
| `selectedFilesText` | `data-selected-files-text` | Template string | `Files: {files} &middot; Size: {size}` | Summary text showing the number and total size of valid selected files. | `selectedFilesText: 'Uploads: {files} · {size}'` | `data-selected-files-text="Uploads: {files} · {size}"` |
| `fileCountText` | `data-file-count-text-singular`, `data-file-count-text-plural` | Object with `singular` and `plural` strings | `1 file`, `{count} files` | Text templates used to announce the number of selected files; singular and plural forms are configured separately. | `fileCountText: {singular: '1 item', plural: '{count} items'}` | `data-file-count-text-singular="1 item" data-file-count-text-plural="{count} items"` |
| `dropLimitText` | `data-drop-limit-text` | Template string | `Up to {files} files · max {size} per file · types: {types}` | Text describing the file-count, size, and type limits below the drop area. | `dropLimitText: 'Maximum {files}; {size} each'` | `data-drop-limit-text="Maximum {files}; {size} each"` |
| `dropLimitExtraText` | `data-drop-limit-extra-text` | Template string | `Total allowed file size: {size}` | Additional text shown when a combined file-size limit is configured. | `dropLimitExtraText: 'Total upload limit: {size}'` | `data-drop-limit-extra-text="Total upload limit: {size}"` |
| `allFileTypesText` | `data-all-file-types-text` | String | `all` | Replacement text used when no file-type restriction is configured. | `allFileTypesText: 'any type'` | `data-all-file-types-text="any type"` |
| `removeButtonLabel` | `data-remove-button-label` | Template string | `Remove {name}` | Accessible label for a file's remove button. | `removeButtonLabel: 'Delete {name}'` | `data-remove-button-label="Delete {name}"` |
| `removeButtonIcon` | `data-remove-button-icon` | String | Built-in SVG cross icon | Content displayed inside each file's remove button. | `removeButtonIcon: 'Remove'` | `data-remove-button-icon="Remove"` |
| `hideSelectedFilesIfEmpty` | `data-hide-selected-files-if-empty` | Boolean | `false` | Hides the complete selected-files section while it contains neither valid nor invalid files. | `hideSelectedFilesIfEmpty: true` | `data-hide-selected-files-if-empty="true"` |
| `preventSubmitIfInvalid` | `data-prevent-submit-if-invalid` | Boolean | `true` | Prevents form submission while one or more invalid file cards remain; empty selections can always be submitted. | `preventSubmitIfInvalid: false` | `data-prevent-submit-if-invalid="false"` |
| `captionActionLabel` | `data-caption-action-label` | String | `File caption` | Label for the action that reveals a file's caption input. | `captionActionLabel: 'Add description'` | `data-caption-action-label="Add description"` |
| `hideCaptionActionLabel` | `data-hide-caption-action-label` | String | `Hide caption` | Label for the action that hides an expanded caption input. | `hideCaptionActionLabel: 'Close description'` | `data-hide-caption-action-label="Close description"` |
| `disableCaptionAction` | `data-disable-caption-action` | Boolean | `false` | Removes the built-in caption action from file cards. | `disableCaptionAction: true` | `data-disable-caption-action="true"` |
| `captionInputLabel` | `data-caption-input-label` | Template string | `Caption / uploaded name` | Label for a file's editable caption input. | `captionInputLabel: 'Description for {name}'` | `data-caption-input-label="Description for {name}"` |
| `previewLabel` | `data-preview-label` | Template string | `Preview of {name}` | Accessible label for a file preview. | `previewLabel: 'File preview: {name}'` | `data-preview-label="File preview: {name}"` |
| `fileSizeLabel` | `data-file-size-label` | Template string | `Size: {value}` | Label prefix for each displayed file size. | `fileSizeLabel: 'File size: {value}'` | `data-file-size-label="File size: {value}"` |
| `fileTypeLabel` | `data-file-type-label` | Template string | `Type: {value}` | Label prefix for the displayed file type. | `fileTypeLabel: 'MIME type: {value}'` | `data-file-type-label="MIME type: {value}"` |
| `unknownFileTypeText` | `data-unknown-file-type-text` | String | `Unknown type` | Text shown when a file has no detected MIME type. | `unknownFileTypeText: 'Not specified'` | `data-unknown-file-type-text="Not specified"` |
| `unknownFileExtensionText` | `data-unknown-file-extension-text` | String | `FILE` | Fallback extension text shown when a file has no extension. | `unknownFileExtensionText: 'File'` | `data-unknown-file-extension-text="File"` |
| `fileDimensionsLabel` | `data-file-dimensions-label` | Template string | `Dimensions: {width} × {height}` | Label for the width and height of an image. | `fileDimensionsLabel: '{width} by {height} pixels'` | `data-file-dimensions-label="{width} by {height} pixels"` |
| `dimensionsLoadingText` | `data-dimensions-loading-text` | String | `Dimensions: reading…` | Temporary text shown while image dimensions are being read. | `dimensionsLoadingText: 'Reading image size…'` | `data-dimensions-loading-text="Reading image size…"` |
| `dimensionsUnavailableText` | `data-dimensions-unavailable-text` | String | `Dimensions: unavailable` | Text shown when image dimensions cannot be determined. | `dimensionsUnavailableText: 'Image size unavailable'` | `data-dimensions-unavailable-text="Image size unavailable"` |
| `validationMessagesText` | `data-validation-messages-text-oversized`, `data-validation-messages-text-disallowed-type`, `data-validation-messages-text-total-size-exceeded` | Object or individual strings | Built-in messages | Error text for files exceeding size, type, or total-size limits. | `validationMessagesText: {oversized: 'Too large.'}` | `data-validation-messages-text-oversized="Too large."` |
| `actions` | Not supported | Array of `{class, label, handler}` objects | `[]` | JavaScript-only custom actions appended to each file card's action bar; handlers receive the file and wrapper ID. | `actions: [{class: 'download', label: 'Download', handler: (file, wrapperId) => download(file, wrapperId)}]` | Not supported |
| `onInitialized` | Not supported | `(wrapperId: string) => void` callback | None | JavaScript-only callback invoked once after the component wrapper has been initialized and rendered. | `onInitialized: (wrapperId) => log(wrapperId)` | Not supported |
| `onFileAdded` | Not supported | `(file: File, wrapperId: string) => void` callback | None | JavaScript-only callback invoked for each newly accepted file and given the component wrapper ID. | `onFileAdded: (file, wrapperId) => log(file, wrapperId)` | Not supported |
| `onFileRemoved` | Not supported | `(file: File, wrapperId: string) => void` callback | None | JavaScript-only callback invoked when an accepted file is removed and given the component wrapper ID. | `onFileRemoved: (file, wrapperId) => log(file, wrapperId)` | Not supported |

All template tags use `{tag}` syntax. Available tags are `{count}` for file-count strings, `{files}` and `{size}` for the selected-files summary, `{files}`, `{size}`, and `{types}` for the drop limit, `{size}` for `dropLimitExtraText`, `{name}` for file names, `{value}` for size/type values, and `{width}` plus `{height}` for image dimensions. The selected-files summary receives the numeric count of valid files in `{files}` and their aggregate formatted size in `{size}`. `dropLimitExtraText` receives the configured combined size limit formatted as `{size}`. Singular and plural file-count strings always have separate `fileCountText.singular` and `fileCountText.plural` settings and separate data attributes.

### Data-options JSON

`data-options` accepts a JSON object containing the same serializable settings as the JavaScript options. Direct attributes override matching JSON properties.

```html
<input
  type="file"
  data-field-up
  data-options='{"maxFiles":6,"disableDropZone":true,"fileCountText":{"singular":"1 upload","plural":"{count} uploads"}}'
  data-max-files="2"
>
```

The resulting `maxFiles` is `2`, because the individual attribute wins. Event callbacks are intentionally not read from HTML or JSON. `actions` are JavaScript options because each action requires a function handler.

### JavaScript-only events and actions

`onInitialized(wrapperId)` runs once after the component wrapper has been initialized and its initial markup has been rendered. `onFileAdded(file, wrapperId)` runs once for each newly accepted, valid `File`, and `onFileRemoved(file, wrapperId)` runs when an accepted file is removed. Invalid files never trigger either file callback. `wrapperId` is the ID of the generated component wrapper.

Custom actions are appended to the flex action bar next to the caption action. Every action requires a CSS `class`, visible `label`, and `handler(file, wrapperId)` function. Set `disableCaptionAction` to remove the built-in caption action.

```ts
new FieldUp(input, {
  onInitialized: (wrapperId) => console.log('Initialized', wrapperId),
  onFileAdded: (file, wrapperId) => console.log('Added', file.name, wrapperId),
  onFileRemoved: (file, wrapperId) => console.log('Removed', file.name, wrapperId),
  actions: [{
    class: 'download-action',
    label: 'Download',
    handler: (file, wrapperId) => download(file, wrapperId),
  }],
});
```

Browse, remove, caption, custom-action, and reveal controls are rendered as `button` elements with explicit types. The drop zone, selected-files heading, and file cards are `div` elements; the selected-files heading retains an explicit level-2 heading role, and live/status text plus accessible names are provided for assistive technology.