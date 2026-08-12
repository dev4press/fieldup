import type {
  AppendFilesResult,
  FieldUpOptions,
  FileCountFormat,
  FileLike,
  InvalidFile,
} from './types';

/** Default maximum number of selectable files. */
export const DEFAULT_MAX_FILES = 4;
/** Default maximum size of an individual file in bytes. */
export const DEFAULT_MAX_FILE_SIZE = 2 * 1024 * 1024;
/** Default total allowed file size; null disables this limit. */
export const DEFAULT_TOTAL_FILE_SIZE_ALLOWED = null;
/** Default singular and plural file-count templates. */
export const DEFAULT_FILE_COUNT_FORMAT: FileCountFormat = {
  singular: '1 file',
  plural: '{count} files',
};

/** Parses a boolean data attribute, returning undefined for absent or unrecognized values. */
export function parseBooleanDataAttribute(value?: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (['', 'true', '1', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  return undefined;
}

/** Converts a byte count to a human-readable value. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;
  const precision =
    unitIndex === 0 || Number.isInteger(value) || value >= 10 ? 0 : 1;

  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

/** Formats a file count with singular or plural text. */
export function formatFileCount(
  count: number,
  format: FileCountFormat = DEFAULT_FILE_COUNT_FORMAT,
): string {
  const template = count === 1 ? format.singular : format.plural;
  return template.replaceAll('{count}', String(count));
}

/** Replaces recognized placeholders in a template with supplied values. */
export function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (tag, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : tag,
  );
}

/** Builds the text describing file-count, size, and type limits. */
export function formatDropLimit(
  template: string,
  maxFiles: number,
  maxFileSize: number,
  allowedFileTypes: readonly string[],
  allFileTypesText = 'all',
): string {
  const allowsAllFileTypes =
    allowedFileTypes.length === 0 ||
    allowedFileTypes.some((type) => {
      const normalizedType = type.trim().toLowerCase();
      return normalizedType === '*' || normalizedType === '*/*';
    });
  const types = allowsAllFileTypes
    ? allFileTypesText
    : allowedFileTypes.join(', ');
  return formatTemplate(template, {
    files: maxFiles === 0 ? 'unlimited' : maxFiles,
    size: maxFileSize === 0 ? 'unlimited' : formatBytes(maxFileSize),
    types,
  });
}

/** Parses a JSON data-options value into partial FieldUp options. */
export function parseDataOptions(value?: string): Partial<FieldUpOptions> {
  if (!value?.trim()) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
      ? (parsed as Partial<FieldUpOptions>)
      : {};
  } catch {
    return {};
  }
}

/** Returns an uppercase file extension or the configured fallback text. */
export function getFileExtension(
  fileName: string,
  unknownFileExtensionText = 'FILE',
): string {
  const name = String(fileName || '');
  const lastDot = name.lastIndexOf('.');

  if (lastDot <= 0 || lastDot === name.length - 1) {
    return unknownFileExtensionText;
  }

  return name.slice(lastDot + 1).toUpperCase();
}

/** Creates the stable key used to identify duplicate files. */
export function getFileKey(file: FileLike): string {
  return [file.name, file.size, file.lastModified, file.type].join(':');
}

/** Appends valid, unique files while reporting rejected files and counts. */
export function appendUniqueFiles(
  currentFiles: readonly FileLike[],
  incomingFiles: readonly FileLike[],
  maxFiles: number,
  maxFileSize: number,
  allowedFileTypes: readonly string[],
  totalFileSizeAllowed: number | null = DEFAULT_TOTAL_FILE_SIZE_ALLOWED,
): AppendFilesResult {
  const files = [...currentFiles];
  const keys = new Set(files.map(getFileKey));
  const invalidFiles: InvalidFile[] = [];
  let totalSizeExceededCount = 0;
  let totalFileSize = files.reduce((size, file) => size + file.size, 0);
  let duplicateCount = 0;
  let limitCount = 0;
  let oversizedCount = 0;
  let disallowedTypeCount = 0;

  for (const file of incomingFiles) {
    if (keys.has(getFileKey(file))) {
      duplicateCount += 1;
      continue;
    }

    if (maxFileSize !== 0 && file.size > maxFileSize) {
      oversizedCount += 1;
      invalidFiles.push({ file, reason: 'oversized' });
      keys.add(getFileKey(file));
      continue;
    }

    if (!matchesAllowedFileType(file, allowedFileTypes)) {
      disallowedTypeCount += 1;
      invalidFiles.push({ file, reason: 'disallowed-type' });
      keys.add(getFileKey(file));
      continue;
    }

    if (
      totalFileSizeAllowed !== null &&
      totalFileSize + file.size > totalFileSizeAllowed
    ) {
      totalSizeExceededCount += 1;
      invalidFiles.push({ file, reason: 'total-size-exceeded' });
      keys.add(getFileKey(file));
      continue;
    }

    if (maxFiles !== 0 && files.length >= maxFiles) {
      limitCount += 1;
      continue;
    }

    files.push(file);
    totalFileSize += file.size;
    keys.add(getFileKey(file));
  }

  return {
    files,
    invalidFiles,
    duplicateCount,
    limitCount,
    oversizedCount,
    disallowedTypeCount,
    totalSizeExceededCount,
  };
}

/** Parses a non-negative maximum-file count; zero means no limit. */
export function parseMaxFiles(value?: string): number {
  const maxFiles = Number.parseInt(value ?? '', 10);
  return Number.isInteger(maxFiles) && maxFiles >= 0
    ? maxFiles
    : DEFAULT_MAX_FILES;
}

/** Parses a non-negative per-file size limit; zero means no limit. */
export function parseMaxFileSize(value?: string): number {
  const maxFileSize = Number.parseInt(value ?? '', 10);
  return Number.isSafeInteger(maxFileSize) && maxFileSize >= 0
    ? maxFileSize
    : DEFAULT_MAX_FILE_SIZE;
}

/** Parses a positive total-size limit, returning null when none is configured. */
export function parseTotalFileSizeAllowed(value?: string): number | null {
  const totalFileSizeAllowed = Number.parseInt(value ?? '', 10);
  return Number.isSafeInteger(totalFileSizeAllowed) && totalFileSizeAllowed > 0
    ? totalFileSizeAllowed
    : null;
}

/** Parses a comma-separated list of allowed file-type patterns. */
export function parseAllowedFileTypes(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((type) => type.trim())
    .filter(Boolean);
}

/** Normalizes a caption field name to array syntax. */
export function normalizeCaptionName(value?: string): string {
  const name = (value ?? '').trim().replace(/(?:\[\])+$/, '');
  return `${name || 'file_captions'}[]`;
}

/** Derives a human-readable default caption from a file name. */
export function getDefaultCaption(fileName: string): string {
  const name = String(fileName || '');
  const lastDot = name.lastIndexOf('.');
  const withoutExtension =
    lastDot > 0 && lastDot < name.length - 1 ? name.slice(0, lastDot) : name;

  return withoutExtension
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) =>
      word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word,
    )
    .join(' ');
}

/** Checks whether a file matches at least one allowed file-type pattern. */
export function matchesAllowedFileType(
  file: FileLike,
  allowedFileTypes: readonly string[],
): boolean {
  const patterns = normalizeAllowedFileTypes(allowedFileTypes);
  if (patterns.length === 0) {
    return true;
  }

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const extension = getFileExtension(file.name).toLowerCase();

  return patterns.some((pattern) => {
    const normalizedPattern = pattern.toLowerCase();

    if (normalizedPattern === '*/*' || normalizedPattern === '*') {
      return true;
    }

    if (normalizedPattern.startsWith('.')) {
      return (
        fileName === normalizedPattern ||
        extension === normalizedPattern.slice(1)
      );
    }

    if (normalizedPattern.endsWith('/*')) {
      return fileType.startsWith(normalizedPattern.slice(0, -1));
    }

    if (normalizedPattern.includes('/')) {
      return fileType === normalizedPattern;
    }

    return extension === normalizedPattern;
  });
}

/** Normalizes the configured allowed file-type patterns. */
export function normalizeAllowedFileTypes(
  allowedFileTypes: readonly string[],
): string[] {
  return parseAllowedFileTypes(allowedFileTypes.join(','));
}

/** Returns a required matching element or throws when it cannot be found. */
export function queryRequired<T extends Element>(
  parent: ParentNode,
  selector: string,
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(`FieldUp could not find required element: ${selector}`);
  }

  return element;
}
