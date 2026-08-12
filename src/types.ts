/** Describes the file metadata needed during validation and deduplication. */
export interface FileLike {
  readonly name: string;
  readonly size: number;
  readonly lastModified: number;
  readonly type: string;
}

/** Represents a valid selected file and its caption. */
export interface SelectedFile {
  file: File;
  caption: string;
}

/** Lists reasons a file can fail validation. */
export type FileValidationError =
  'oversized' | 'disallowed-type' | 'total-size-exceeded';

/** Represents a rejected file-like value and its validation reason. */
export interface InvalidFile {
  file: FileLike;
  reason: FileValidationError;
}

/** Represents a selected file rejected during validation. */
export interface InvalidSelectedFile {
  file: File;
  reason: FileValidationError;
}

/** Summarizes files accepted or rejected when incoming files are appended. */
export interface AppendFilesResult {
  files: FileLike[];
  invalidFiles: InvalidFile[];
  duplicateCount: number;
  limitCount: number;
  oversizedCount: number;
  disallowedTypeCount: number;
  totalSizeExceededCount: number;
}

/** Provides singular and plural templates for file counts. */
export interface FileCountFormat {
  singular: string;
  plural: string;
}

/** Defines messages shown for each validation failure. */
export interface ValidationMessages {
  oversized: string;
  disallowedType: string;
  totalSizeExceeded: string;
}

/** Defines an action button available on a selected file. */
export interface FieldUpAction {
  class: string;
  label: string;
  handler: (file: File, wrapperId: string) => void;
}

/** Configures a FieldUp instance; omitted values use defaults. */
export interface FieldUpOptions {
  maxFiles?: number;
  maxFileSize?: number;
  totalFileSizeAllowed?: number | null;
  allowedFileTypes?: readonly string[];
  captionName?: string;
  wrapperClass?: string;
  startCollapsed?: boolean;
  startCollapsedButtonLabel?: string;
  dropAreaTitleText?: string;
  dropAreaHintText?: string;
  dropAreaIcon?: string;
  selectedFilesTitleText?: string;
  noFilesSelectedText?: string;
  selectedFilesText?: string;
  fileCountText?: FileCountFormat;
  dropLimitText?: string;
  dropLimitExtraText?: string;
  allFileTypesText?: string;
  unknownFileExtensionText?: string;
  disableDropZone?: boolean;
  hideSelectedFilesIfEmpty?: boolean;
  preventSubmitIfInvalid?: boolean;
  browseButtonLabel?: string;
  browseButtonIcon?: string;
  removeButtonLabel?: string;
  removeButtonIcon?: string;
  captionActionLabel?: string;
  hideCaptionActionLabel?: string;
  captionInputLabel?: string;
  previewLabel?: string;
  fileSizeLabel?: string;
  fileTypeLabel?: string;
  unknownFileTypeText?: string;
  fileDimensionsLabel?: string;
  dimensionsLoadingText?: string;
  dimensionsUnavailableText?: string;
  validationMessagesText?: Partial<ValidationMessages>;
  disableCaptionAction?: boolean;
  actions?: readonly FieldUpAction[];
  onInitialized?: (wrapperId: string) => void;
  onFileAdded?: (file: File, wrapperId: string) => void;
  onFileRemoved?: (file: File, wrapperId: string) => void;
}

/** Contains the normalized settings used by a FieldUp instance. */
export interface FieldUpSettings {
  maxFiles: number;
  maxFileSize: number;
  totalFileSizeAllowed: number | null;
  allowedFileTypes: string[];
  captionName: string;
  wrapperClass: string;
  startCollapsed: boolean;
  startCollapsedButtonLabel: string;
  dropAreaTitleText: string;
  dropAreaHintText: string;
  dropAreaIcon: string;
  selectedFilesTitleText: string;
  noFilesSelectedText: string;
  selectedFilesText: string;
  fileCountText: FileCountFormat;
  dropLimitText: string;
  dropLimitExtraText: string;
  allFileTypesText: string;
  unknownFileExtensionText: string;
  disableDropZone: boolean;
  hideSelectedFilesIfEmpty: boolean;
  preventSubmitIfInvalid: boolean;
  browseButtonLabel: string;
  browseButtonIcon: string;
  removeButtonLabel: string;
  removeButtonIcon: string;
  captionActionLabel: string;
  hideCaptionActionLabel: string;
  captionInputLabel: string;
  previewLabel: string;
  fileSizeLabel: string;
  fileTypeLabel: string;
  unknownFileTypeText: string;
  fileDimensionsLabel: string;
  dimensionsLoadingText: string;
  dimensionsUnavailableText: string;
  validationMessagesText: ValidationMessages;
  disableCaptionAction: boolean;
  actions: readonly FieldUpAction[];
  onInitialized?: (wrapperId: string) => void;
  onFileAdded?: (file: File, wrapperId: string) => void;
  onFileRemoved?: (file: File, wrapperId: string) => void;
}
