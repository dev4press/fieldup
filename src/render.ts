import { formatBytes, formatTemplate, getFileExtension } from './utils';
import type {
  FieldUpSettings,
  InvalidSelectedFile,
  SelectedFile,
} from './types';

/** Builds the upload field markup and wires its interactive controls. */
export function createFieldMarkup(
  input: HTMLInputElement,
  settings: FieldUpSettings,
  instanceId: string,
  signal: AbortSignal,
): HTMLDivElement {
  const inputParent = input.parentElement;
  if (!inputParent) {
    throw new Error(
      'FieldUp requires the file upload input to have a parent element.',
    );
  }

  const fieldRoot = document.createElement('div');
  fieldRoot.className = ['field-up-wrapper', settings.wrapperClass]
    .filter(Boolean)
    .join(' ');
  fieldRoot.dataset.fieldUp = '';
  fieldRoot.id = `${instanceId}-wrapper`;
  fieldRoot.hidden = settings.startCollapsed;
  inputParent.insertBefore(fieldRoot, input);

  if (settings.startCollapsed) {
    const expandButton = document.createElement('button');
    expandButton.className = 'field-up-expand-button';
    expandButton.type = 'button';
    expandButton.textContent = settings.startCollapsedButtonLabel;
    expandButton.setAttribute('data-expand-button', '');
    expandButton.setAttribute('aria-controls', fieldRoot.id);
    expandButton.setAttribute('aria-expanded', 'false');
    inputParent.insertBefore(expandButton, fieldRoot);
    expandButton.addEventListener(
      'click',
      () => {
        fieldRoot.hidden = false;
        expandButton.parentElement?.removeChild(expandButton);
      },
      { signal },
    );
  }

  if (!input.id) {
    input.id = `${instanceId}-input`;
  }

  const pickerArea = document.createElement('div');
  pickerArea.className = 'field-up-file-picker-area';

  const dropZone = document.createElement('div');
  dropZone.className = 'field-up-drop-zone';
  dropZone.setAttribute('data-drop-zone', '');
  dropZone.setAttribute('role', 'group');

  const icon = document.createElement('span');
  icon.className = 'field-up-drop-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = settings.dropAreaIcon;

  const title = document.createElement('span');
  title.className = 'field-up-drop-title';
  title.id = `${instanceId}-drop-title`;
  title.textContent = settings.dropAreaTitleText;

  const hint = document.createElement('span');
  hint.className = 'field-up-drop-hint';
  hint.id = `${instanceId}-drop-hint`;
  hint.textContent = settings.dropAreaHintText;

  const limit = document.createElement('span');
  limit.className = 'field-up-drop-limit';
  limit.id = `${instanceId}-drop-limit`;
  limit.setAttribute('data-file-limit', '');

  const extraLimit =
    settings.totalFileSizeAllowed === null
      ? null
      : document.createElement('span');
  if (extraLimit) {
    extraLimit.className = 'field-up-drop-limit-extra';
    extraLimit.id = `${instanceId}-drop-limit-extra`;
    extraLimit.setAttribute('data-file-limit-extra', '');
  }
  const limitElements = extraLimit ? [limit, extraLimit] : [limit];

  const browseButton = document.createElement('button');
  browseButton.className = 'field-up-button field-up-button-secondary';
  browseButton.type = 'button';
  browseButton.setAttribute('data-browse-button', '');
  browseButton.setAttribute('aria-label', settings.browseButtonLabel);
  browseButton.addEventListener('click', () => input.click(), { signal });

  const browseIcon = document.createElement('span');
  browseIcon.className = 'field-up-browse-icon';
  browseIcon.setAttribute('aria-hidden', 'true');
  browseIcon.innerHTML = settings.browseButtonIcon;

  const browseLabel = document.createElement('span');
  browseLabel.textContent = settings.browseButtonLabel;
  browseButton.append(
    ...(settings.disableDropZone ? [browseIcon, browseLabel] : [browseLabel]),
  );

  input.setAttribute('aria-labelledby', title.id);
  input.setAttribute(
    'aria-describedby',
    [hint.id, limit.id, extraLimit?.id].filter(Boolean).join(' '),
  );

  if (settings.disableDropZone) {
    const pickerControls = document.createElement('div');
    pickerControls.className = 'field-up-picker-controls';
    input.removeAttribute('aria-labelledby');
    input.removeAttribute('aria-describedby');
    input.setAttribute('aria-label', settings.browseButtonLabel);
    pickerControls.append(browseButton, ...limitElements);
    pickerArea.append(pickerControls, input);
  } else {
    dropZone.setAttribute('aria-labelledby', title.id);
    dropZone.append(icon, title, hint, ...limitElements, browseButton, input);
    pickerArea.append(dropZone);
  }

  const selectedFiles = document.createElement('div');
  selectedFiles.className = 'field-up-selected-files';
  selectedFiles.setAttribute('data-selected-files', '');
  selectedFiles.setAttribute('aria-live', 'polite');
  selectedFiles.setAttribute(
    'aria-labelledby',
    `${instanceId}-selected-files-title`,
  );

  const selectedFilesHeading = document.createElement('div');
  selectedFilesHeading.className = 'field-up-selected-files-heading';

  const selectedFilesTitle = document.createElement('div');
  selectedFilesTitle.className = 'field-up-selected-files-title';
  selectedFilesTitle.id = `${instanceId}-selected-files-title`;
  selectedFilesTitle.setAttribute('role', 'heading');
  selectedFilesTitle.setAttribute('aria-level', '2');
  selectedFilesTitle.textContent = settings.selectedFilesTitleText;

  const fileSummary = document.createElement('span');
  fileSummary.className = 'field-up-file-summary';
  fileSummary.setAttribute('data-file-summary', '');

  selectedFilesHeading.append(selectedFilesTitle, fileSummary);

  const fileList = document.createElement('div');
  fileList.className = 'field-up-file-list';
  fileList.setAttribute('data-file-list', '');
  fileList.setAttribute('role', 'list');

  const emptyState = document.createElement('p');
  emptyState.className = 'field-up-empty-state';
  emptyState.setAttribute('data-empty-state', '');
  emptyState.textContent = settings.noFilesSelectedText;
  fileList.append(emptyState);

  selectedFiles.append(selectedFilesHeading, fileList);
  fieldRoot.append(pickerArea, selectedFiles);

  return fieldRoot;
}

/** Builds a file item card with its preview, metadata, actions, and validation feedback. */
export function createFileCard(
  item: SelectedFile | InvalidSelectedFile,
  index: number,
  context: {
    instanceId: string;
    wrapperId: string;
    captionName: string;
    previewUrls: string[];
    settings: FieldUpSettings;
  },
  invalid = false,
): HTMLElement {
  const card = document.createElement('div');
  card.className = [
    'field-up-file-item',
    invalid ? 'field-up-file-item-error' : '',
  ]
    .filter(Boolean)
    .join(' ');
  card.setAttribute(
    invalid ? 'data-invalid-file-index' : 'data-file-index',
    String(index),
  );
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', item.file.name);

  const preview = document.createElement('div');
  preview.className = 'field-up-file-preview';
  preview.setAttribute(
    'aria-label',
    formatTemplate(context.settings.previewLabel, { name: item.file.name }),
  );

  if (item.file.type.startsWith('image/')) {
    const image = document.createElement('img');
    const objectUrl = URL.createObjectURL(item.file);
    image.src = objectUrl;
    image.alt = '';
    context.previewUrls.push(objectUrl);
    preview.append(image);
  } else {
    const extension = document.createElement('span');
    extension.className = 'field-up-file-extension';
    extension.textContent = getFileExtension(
      item.file.name,
      context.settings.unknownFileExtensionText,
    );
    preview.append(extension);
  }

  const details = document.createElement('div');
  details.className = 'field-up-file-details';

  const name = document.createElement('p');
  name.className = 'field-up-file-name';
  name.title = item.file.name;
  name.textContent = item.file.name;
  details.append(name);

  const info = document.createElement('div');
  info.className = 'field-up-file-info';
  info.append(
    createInfoValue(
      context.settings.fileSizeLabel,
      formatBytes(item.file.size),
    ),
  );
  info.append(
    createInfoValue(
      context.settings.fileTypeLabel,
      item.file.type || context.settings.unknownFileTypeText,
    ),
  );

  const isImage = item.file.type.startsWith('image/');
  const dimensions = document.createElement('span');
  dimensions.textContent = context.settings.dimensionsLoadingText;
  dimensions.dataset.dimensionsTemplate = context.settings.fileDimensionsLabel;
  dimensions.dataset.dimensionsUnavailable =
    context.settings.dimensionsUnavailableText;
  if (isImage) {
    info.append(dimensions);
  }
  details.append(info);

  if (isImage) {
    readImageDimensions(item.file, dimensions, context.previewUrls);
  }

  if (invalid) {
    const error = document.createElement('p');
    error.className = 'field-up-file-error';
    error.setAttribute('data-file-error', '');
    error.setAttribute('role', 'alert');
    const reason = (item as InvalidSelectedFile).reason;
    error.textContent =
      context.settings.validationMessagesText[
        reason === 'disallowed-type'
          ? 'disallowedType'
          : reason === 'total-size-exceeded'
            ? 'totalSizeExceeded'
            : 'oversized'
      ];
    details.append(error);
  } else {
    const actions = document.createElement('div');
    actions.className = 'field-up-actions';
    actions.setAttribute('data-actions', '');

    if (!context.settings.disableCaptionAction) {
      const captionToggle = document.createElement('button');
      captionToggle.className = 'field-up-caption-toggle';
      captionToggle.type = 'button';
      captionToggle.textContent = context.settings.captionActionLabel;
      captionToggle.setAttribute('data-caption-toggle-index', String(index));
      captionToggle.setAttribute('aria-expanded', 'false');
      captionToggle.setAttribute(
        'aria-controls',
        `${context.instanceId}-caption-${index}`,
      );
      actions.append(captionToggle);
    }

    context.settings.actions.forEach((action) => {
      const actionButton = document.createElement('button');
      actionButton.className = ['field-up-action', action.class]
        .filter(Boolean)
        .join(' ');
      actionButton.type = 'button';
      actionButton.textContent = action.label;
      actionButton.addEventListener(
        'click',
        () => action.handler(item.file, context.wrapperId),
        { once: false },
      );
      actions.append(actionButton);
    });

    const caption = document.createElement('input');
    caption.className = 'field-up-caption-input';
    caption.type = 'text';
    caption.id = `${context.instanceId}-caption-${index}`;
    caption.name = context.captionName;
    caption.value = (item as SelectedFile).caption;
    caption.maxLength = 255;
    caption.hidden = true;
    caption.setAttribute('data-caption-index', String(index));
    caption.setAttribute('data-caption-input', '');
    caption.setAttribute(
      'aria-label',
      formatTemplate(context.settings.captionInputLabel, {
        name: item.file.name,
      }),
    );
    details.append(actions, caption);
  }

  const remove = document.createElement('button');
  remove.className = 'field-up-remove-file';
  remove.type = 'button';
  remove.setAttribute(
    invalid ? 'data-remove-invalid-index' : 'data-remove-index',
    String(index),
  );
  remove.setAttribute(
    'aria-label',
    formatTemplate(context.settings.removeButtonLabel, {
      name: item.file.name,
    }),
  );
  remove.title = formatTemplate(context.settings.removeButtonLabel, {
    name: item.file.name,
  });
  remove.innerHTML = context.settings.removeButtonIcon;

  card.append(preview, details, remove);
  return card;
}

/** Creates a metadata element from a label template and value. */
function createInfoValue(label: string, value: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.textContent = formatTemplate(label, { value });
  return element;
}

/** Loads an image to populate its natural dimensions and tracks its object URL. */
function readImageDimensions(
  file: File,
  target: HTMLElement,
  previewUrls: string[],
): void {
  const objectUrl = URL.createObjectURL(file);
  previewUrls.push(objectUrl);
  const image = new Image();
  image.onload = (): void => {
    target.textContent = formatTemplate(
      target.dataset.dimensionsTemplate ?? 'Dimensions: {width} × {height}',
      {
        width: image.naturalWidth,
        height: image.naturalHeight,
      },
    );
    URL.revokeObjectURL(objectUrl);
  };
  image.onerror = (): void => {
    target.textContent =
      target.dataset.dimensionsUnavailable ?? 'Dimensions: unavailable';
    URL.revokeObjectURL(objectUrl);
  };
  image.src = objectUrl;
}
