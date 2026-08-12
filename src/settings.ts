import {
  DEFAULT_FILE_COUNT_FORMAT,
  normalizeAllowedFileTypes,
  normalizeCaptionName,
  parseAllowedFileTypes,
  parseBooleanDataAttribute,
  parseDataOptions,
  parseMaxFiles,
  parseMaxFileSize,
  parseTotalFileSizeAllowed,
} from './utils';
import type { FieldUpOptions, FieldUpSettings } from './types';

const DEFAULT_DROP_LIMIT_TEXT =
  'Up to {files} files · max {size} per file · types: {types}';
const DEFAULT_DROP_LIMIT_EXTRA_TEXT = 'Total allowed file size: {size}';
const DEFAULT_DROP_AREA_TITLE_TEXT = 'Choose files to upload';
const DEFAULT_DROP_AREA_HINT_TEXT = 'or drag and drop them here';
const DEFAULT_DROP_AREA_ICON =
  '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" /></svg>';
const DEFAULT_SELECTED_FILES_TITLE_TEXT = 'Selected files';
const DEFAULT_NO_FILES_SELECTED_TEXT = 'No files selected yet.';
const DEFAULT_SELECTED_FILES_TEXT = 'Files: {files} &middot; Size: {size}';
const DEFAULT_START_COLLAPSED_BUTTON_LABEL = 'Upload Files';
const DEFAULT_ALL_FILE_TYPES_TEXT = 'all';
const DEFAULT_UNKNOWN_FILE_EXTENSION_TEXT = 'FILE';
const DEFAULT_BROWSE_BUTTON_LABEL = 'Browse files';
const DEFAULT_BROWSE_BUTTON_ICON =
  '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" /></svg>';
const DEFAULT_REMOVE_BUTTON_LABEL = 'Remove {name}';
const DEFAULT_REMOVE_BUTTON_ICON =
  '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>';
const DEFAULT_CAPTION_ACTION_LABEL = 'File caption';
const DEFAULT_HIDE_CAPTION_ACTION_LABEL = 'Hide caption';
const DEFAULT_CAPTION_INPUT_LABEL = 'Caption / uploaded name';
const DEFAULT_PREVIEW_LABEL = 'Preview of {name}';
const DEFAULT_FILE_SIZE_LABEL = 'Size: {value}';
const DEFAULT_FILE_TYPE_LABEL = 'Type: {value}';
const DEFAULT_UNKNOWN_FILE_TYPE_TEXT = 'Unknown type';
const DEFAULT_FILE_DIMENSIONS_LABEL = 'Dimensions: {width} × {height}';
const DEFAULT_DIMENSIONS_LOADING_TEXT = 'Dimensions: reading…';
const DEFAULT_DIMENSIONS_UNAVAILABLE_TEXT = 'Dimensions: unavailable';
const DEFAULT_VALIDATION_MESSAGES = {
  oversized: 'File is oversized.',
  disallowedType: 'File type is not allowed.',
  totalSizeExceeded: 'Total file size limit exceeded.',
};

/** Merges input attributes and options into normalized FieldUp settings. */
export function prepareSettings(
  input: HTMLInputElement,
  options: FieldUpOptions,
): FieldUpSettings {
  const { dataset } = input;
  const dataStartCollapsed = parseBooleanDataAttribute(dataset.startCollapsed);
  const jsonOptions = parseDataOptions(dataset.options);
  const dataOptions: FieldUpOptions = {};
  const dataBooleanOptions: Array<
    keyof Pick<
      FieldUpOptions,
      | 'disableDropZone'
      | 'hideSelectedFilesIfEmpty'
      | 'preventSubmitIfInvalid'
      | 'disableCaptionAction'
    >
  > = [
    'disableDropZone',
    'hideSelectedFilesIfEmpty',
    'preventSubmitIfInvalid',
    'disableCaptionAction',
  ];
  const dataStringOptions: Array<keyof FieldUpOptions> = [
    'captionName',
    'wrapperClass',
    'startCollapsedButtonLabel',
    'dropAreaTitleText',
    'dropAreaHintText',
    'dropAreaIcon',
    'selectedFilesTitleText',
    'noFilesSelectedText',
    'selectedFilesText',
    'dropLimitText',
    'dropLimitExtraText',
    'allFileTypesText',
    'unknownFileExtensionText',
    'browseButtonLabel',
    'browseButtonIcon',
    'removeButtonLabel',
    'removeButtonIcon',
    'captionActionLabel',
    'hideCaptionActionLabel',
    'captionInputLabel',
    'previewLabel',
    'fileSizeLabel',
    'fileTypeLabel',
    'unknownFileTypeText',
    'fileDimensionsLabel',
    'dimensionsLoadingText',
    'dimensionsUnavailableText',
  ];

  dataBooleanOptions.forEach((key) => {
    const value = parseBooleanDataAttribute(dataset[key]);
    if (value !== undefined) {
      dataOptions[key] = value;
    }
  });
  dataStringOptions.forEach((key) => {
    const value = dataset[key];
    if (value !== undefined) {
      Object.assign(dataOptions, { [key]: value });
    }
  });

  const dataFileCount: Partial<NonNullable<FieldUpOptions['fileCountText']>> =
    {};
  if (dataset.fileCountTextSingular !== undefined) {
    dataFileCount.singular = dataset.fileCountTextSingular;
  }
  if (dataset.fileCountTextPlural !== undefined) {
    dataFileCount.plural = dataset.fileCountTextPlural;
  }
  const jsonFileCount = jsonOptions.fileCountText ?? options.fileCountText;
  const fileCountText =
    jsonFileCount ||
    dataFileCount.singular !== undefined ||
    dataFileCount.plural !== undefined
      ? { ...DEFAULT_FILE_COUNT_FORMAT, ...jsonFileCount, ...dataFileCount }
      : DEFAULT_FILE_COUNT_FORMAT;

  const dataValidationMessagesText: NonNullable<
    FieldUpOptions['validationMessagesText']
  > = {};
  if (dataset.validationMessagesTextOversized !== undefined) {
    dataValidationMessagesText.oversized =
      dataset.validationMessagesTextOversized;
  }
  if (dataset.validationMessagesTextDisallowedType !== undefined) {
    dataValidationMessagesText.disallowedType =
      dataset.validationMessagesTextDisallowedType;
  }
  if (dataset.validationMessagesTextTotalSizeExceeded !== undefined) {
    dataValidationMessagesText.totalSizeExceeded =
      dataset.validationMessagesTextTotalSizeExceeded;
  }
  const validationMessagesText = {
    ...DEFAULT_VALIDATION_MESSAGES,
    ...(options.validationMessagesText ?? {}),
    ...(jsonOptions.validationMessagesText ?? {}),
    ...dataValidationMessagesText,
  };
  const mergedOptions = { ...options, ...jsonOptions, ...dataOptions };

  return {
    maxFiles: parseMaxFiles(
      dataset.maxFiles ?? mergedOptions.maxFiles?.toString(),
    ),
    maxFileSize: parseMaxFileSize(
      dataset.maxFileSize ?? mergedOptions.maxFileSize?.toString(),
    ),
    totalFileSizeAllowed: parseTotalFileSizeAllowed(
      dataset.totalFileSizeAllowed ??
        mergedOptions.totalFileSizeAllowed?.toString(),
    ),
    allowedFileTypes:
      dataset.allowedFileTypes === undefined
        ? normalizeAllowedFileTypes(
            mergedOptions.allowedFileTypes ??
              parseAllowedFileTypes(input.accept),
          )
        : parseAllowedFileTypes(dataset.allowedFileTypes),
    captionName: normalizeCaptionName(mergedOptions.captionName),
    wrapperClass: (mergedOptions.wrapperClass ?? '').trim(),
    startCollapsed: dataStartCollapsed ?? mergedOptions.startCollapsed ?? false,
    startCollapsedButtonLabel:
      mergedOptions.startCollapsedButtonLabel ??
      DEFAULT_START_COLLAPSED_BUTTON_LABEL,
    dropAreaTitleText:
      mergedOptions.dropAreaTitleText ?? DEFAULT_DROP_AREA_TITLE_TEXT,
    dropAreaHintText:
      mergedOptions.dropAreaHintText ?? DEFAULT_DROP_AREA_HINT_TEXT,
    dropAreaIcon: mergedOptions.dropAreaIcon ?? DEFAULT_DROP_AREA_ICON,
    selectedFilesTitleText:
      mergedOptions.selectedFilesTitleText ?? DEFAULT_SELECTED_FILES_TITLE_TEXT,
    noFilesSelectedText:
      mergedOptions.noFilesSelectedText ?? DEFAULT_NO_FILES_SELECTED_TEXT,
    selectedFilesText:
      mergedOptions.selectedFilesText ?? DEFAULT_SELECTED_FILES_TEXT,
    fileCountText,
    dropLimitText: mergedOptions.dropLimitText ?? DEFAULT_DROP_LIMIT_TEXT,
    dropLimitExtraText:
      mergedOptions.dropLimitExtraText ?? DEFAULT_DROP_LIMIT_EXTRA_TEXT,
    allFileTypesText:
      mergedOptions.allFileTypesText ?? DEFAULT_ALL_FILE_TYPES_TEXT,
    unknownFileExtensionText:
      mergedOptions.unknownFileExtensionText ??
      DEFAULT_UNKNOWN_FILE_EXTENSION_TEXT,
    disableDropZone: mergedOptions.disableDropZone ?? false,
    hideSelectedFilesIfEmpty: mergedOptions.hideSelectedFilesIfEmpty ?? false,
    preventSubmitIfInvalid: mergedOptions.preventSubmitIfInvalid ?? true,
    browseButtonLabel:
      mergedOptions.browseButtonLabel ?? DEFAULT_BROWSE_BUTTON_LABEL,
    browseButtonIcon:
      mergedOptions.browseButtonIcon ?? DEFAULT_BROWSE_BUTTON_ICON,
    removeButtonLabel:
      mergedOptions.removeButtonLabel ?? DEFAULT_REMOVE_BUTTON_LABEL,
    removeButtonIcon:
      mergedOptions.removeButtonIcon ?? DEFAULT_REMOVE_BUTTON_ICON,
    captionActionLabel:
      mergedOptions.captionActionLabel ?? DEFAULT_CAPTION_ACTION_LABEL,
    hideCaptionActionLabel:
      mergedOptions.hideCaptionActionLabel ?? DEFAULT_HIDE_CAPTION_ACTION_LABEL,
    captionInputLabel:
      mergedOptions.captionInputLabel ?? DEFAULT_CAPTION_INPUT_LABEL,
    previewLabel: mergedOptions.previewLabel ?? DEFAULT_PREVIEW_LABEL,
    fileSizeLabel: mergedOptions.fileSizeLabel ?? DEFAULT_FILE_SIZE_LABEL,
    fileTypeLabel: mergedOptions.fileTypeLabel ?? DEFAULT_FILE_TYPE_LABEL,
    unknownFileTypeText:
      mergedOptions.unknownFileTypeText ?? DEFAULT_UNKNOWN_FILE_TYPE_TEXT,
    fileDimensionsLabel:
      mergedOptions.fileDimensionsLabel ?? DEFAULT_FILE_DIMENSIONS_LABEL,
    dimensionsLoadingText:
      mergedOptions.dimensionsLoadingText ?? DEFAULT_DIMENSIONS_LOADING_TEXT,
    dimensionsUnavailableText:
      mergedOptions.dimensionsUnavailableText ??
      DEFAULT_DIMENSIONS_UNAVAILABLE_TEXT,
    validationMessagesText,
    disableCaptionAction: mergedOptions.disableCaptionAction ?? false,
    actions: options.actions ?? [],
    onInitialized: options.onInitialized,
    onFileAdded: options.onFileAdded,
    onFileRemoved: options.onFileRemoved,
  };
}
