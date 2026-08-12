import { expect, test } from 'vitest';

import {
  appendUniqueFiles,
  DEFAULT_MAX_FILE_SIZE,
  formatBytes,
  formatDropLimit,
  formatFileCount,
  getDefaultCaption,
  getFileExtension,
  matchesAllowedFileType,
  normalizeCaptionName,
  parseAllowedFileTypes,
  parseMaxFileSize,
  parseMaxFiles,
  parseTotalFileSizeAllowed,
} from '../src/utils';
import { fakeFile } from './setup';

test('formats byte counts for empty, byte, kilobyte, and megabyte files', () => {
  expect(formatBytes(0)).toBe('0 B');
  expect(formatBytes(512)).toBe('512 B');
  expect(formatBytes(1024)).toBe('1 KB');
  expect(formatBytes(1536)).toBe('1.5 KB');
  expect(formatBytes(1024 * 1024)).toBe('1 MB');
});

test('formats singular and plural file counts from configurable templates', () => {
  const format = { singular: '1 file', plural: '{count} files' };

  expect(formatFileCount(0, format)).toBe('0 files');
  expect(formatFileCount(1, format)).toBe('1 file');
  expect(formatFileCount(3, format)).toBe('3 files');
});

test('formats drop limits from configurable templates', () => {
  expect(
    formatDropLimit(
      'Up to {files} files · max {size} per file · types: {types}',
      4,
      10485760,
      ['image/*', '.pdf'],
    ),
  ).toBe('Up to 4 files · max 10 MB per file · types: image/*, .pdf');
  expect(
    formatDropLimit(
      'Up to {files} files · max {size} per file · types: {types}',
      1,
      1572864,
      [],
    ),
  ).toBe('Up to 1 files · max 1.5 MB per file · types: all');
  expect(
    formatDropLimit(
      'Up to {files} files · max {size} per file · types: {types}',
      4,
      1024 ** 3,
      ['*/*'],
    ),
  ).toBe('Up to 4 files · max 1 GB per file · types: all');
  expect(
    formatDropLimit(
      'Up to {files} files · max {size} per file · types: {types}',
      0,
      0,
      [],
    ),
  ).toBe('Up to unlimited files · max unlimited per file · types: all');
});

test('handles missing, hidden, and normal file extensions', () => {
  expect(getFileExtension('photo.final.JPG')).toBe('JPG');
  expect(getFileExtension('report.pdf')).toBe('PDF');
  expect(getFileExtension('README')).toBe('FILE');
  expect(getFileExtension('.env')).toBe('FILE');
  expect(getFileExtension('broken.')).toBe('FILE');
});

test('creates natural default captions from file names', () => {
  expect(getDefaultCaption('summerHolidayPhoto.jpg')).toBe(
    'Summer Holiday Photo',
  );
  expect(getDefaultCaption('summer_holiday-photo.PNG')).toBe(
    'Summer Holiday Photo',
  );
  expect(getDefaultCaption('archive.tar.gz')).toBe('Archive.tar');
  expect(getDefaultCaption('README')).toBe('README');
});

test('normalizes the caption field name and appends array notation once', () => {
  expect(normalizeCaptionName('captions')).toBe('captions[]');
  expect(normalizeCaptionName('captions[]')).toBe('captions[]');
  expect(normalizeCaptionName('captions[][]')).toBe('captions[]');
  expect(normalizeCaptionName('  ')).toBe('file_captions[]');
  expect(normalizeCaptionName()).toBe('file_captions[]');
});

test('rejects duplicate files while retaining their original order', () => {
  const first = fakeFile('first.txt', 10, 100);
  const second = fakeFile('second.txt', 20, 200);
  const duplicate = fakeFile('first.txt', 10, 100);

  const result = appendUniqueFiles(
    [first],
    [duplicate, second],
    5,
    DEFAULT_MAX_FILE_SIZE,
    [],
  );

  expect(result.files).toEqual([first, second]);
  expect(result.duplicateCount).toBe(1);
  expect(result.limitCount).toBe(0);
});

test('does not add files after the configured maximum', () => {
  const result = appendUniqueFiles(
    [fakeFile('one.txt', 1), fakeFile('two.txt', 2)],
    [fakeFile('three.txt', 3), fakeFile('four.txt', 4)],
    3,
    DEFAULT_MAX_FILE_SIZE,
    [],
  );

  expect(result.files.length).toBe(3);
  const thirdFile = result.files[2];
  expect(thirdFile).toBeTruthy();
  expect(thirdFile?.name).toBe('three.txt');
  expect(result.limitCount).toBe(1);
});

test('allows zero files limit and defaults missing or invalid limits to four files', () => {
  expect(parseMaxFiles('5')).toBe(5);
  expect(parseMaxFiles('0')).toBe(0);
  expect(parseMaxFiles('not-a-number')).toBe(4);
  expect(parseMaxFiles()).toBe(4);
  expect(
    appendUniqueFiles(
      [],
      [
        fakeFile('one.txt', 1),
        fakeFile('two.txt', 2),
        fakeFile('three.txt', 3),
        fakeFile('four.txt', 4),
        fakeFile('five.txt', 5),
      ],
      parseMaxFiles('0'),
      parseMaxFileSize(),
      [],
    ).files.length,
  ).toBe(5);
  expect(
    appendUniqueFiles(
      [],
      [
        fakeFile('one.txt', 1),
        fakeFile('two.txt', 2),
        fakeFile('three.txt', 3),
        fakeFile('four.txt', 4),
        fakeFile('five.txt', 5),
      ],
      parseMaxFiles(),
      parseMaxFileSize(),
      [],
    ).files.length,
  ).toBe(4);
});

test('allows zero file size and defaults missing or invalid sizes to two megabytes', () => {
  expect(parseMaxFileSize('1048576')).toBe(1048576);
  expect(parseMaxFileSize('0')).toBe(0);
  expect(parseMaxFileSize('-1')).toBe(DEFAULT_MAX_FILE_SIZE);
  expect(parseMaxFileSize('not-a-number')).toBe(DEFAULT_MAX_FILE_SIZE);
  expect(parseMaxFileSize()).toBe(DEFAULT_MAX_FILE_SIZE);
  expect(
    appendUniqueFiles(
      [],
      [fakeFile('large.txt', DEFAULT_MAX_FILE_SIZE + 1)],
      parseMaxFiles(),
      parseMaxFileSize('0'),
      [],
    ).oversizedCount,
  ).toBe(0);
  expect(
    appendUniqueFiles(
      [],
      [fakeFile('large.txt', DEFAULT_MAX_FILE_SIZE + 1)],
      parseMaxFiles(),
      parseMaxFileSize(),
      [],
    ).oversizedCount,
  ).toBe(1);
});

test('defaults missing or invalid total file sizes to no limit', () => {
  expect(parseTotalFileSizeAllowed('52428800')).toBe(52428800);
  expect(parseTotalFileSizeAllowed('0')).toBeNull();
  expect(parseTotalFileSizeAllowed('-1')).toBeNull();
  expect(parseTotalFileSizeAllowed('not-a-number')).toBeNull();
  expect(parseTotalFileSizeAllowed()).toBeNull();
});

test('parses allowed file type patterns and matches MIME types and extensions', () => {
  expect(parseAllowedFileTypes(' image/*, .pdf, application/json ')).toEqual([
    'image/*',
    '.pdf',
    'application/json',
  ]);

  expect(
    matchesAllowedFileType(fakeFile('photo.jpg', 10, 1, 'image/jpeg'), [
      'image/*',
    ]),
  ).toBe(true);
  expect(
    matchesAllowedFileType(fakeFile('report.PDF', 10, 1, ''), ['.pdf']),
  ).toBe(true);
  expect(matchesAllowedFileType(fakeFile('.env', 10, 1, ''), ['.env'])).toBe(
    true,
  );
  expect(
    matchesAllowedFileType(fakeFile('data.json', 10, 1, 'text/plain'), [
      'application/json',
    ]),
  ).toBe(false);
  expect(matchesAllowedFileType(fakeFile('notes.txt', 10), [])).toBe(true);
});

test('rejects oversized and disallowed files before applying the file count limit', () => {
  const result = appendUniqueFiles(
    [],
    [
      fakeFile('large.jpg', 11, 1, 'image/jpeg'),
      fakeFile('report.pdf', 10, 2, 'application/pdf'),
      fakeFile('small.jpg', 10, 3, 'image/jpeg'),
      fakeFile('second.jpg', 10, 4, 'image/jpeg'),
    ],
    1,
    10,
    ['image/*'],
  );

  expect(result.files.map((file) => file.name)).toEqual(['small.jpg']);
  expect(result.oversizedCount).toBe(1);
  expect(result.disallowedTypeCount).toBe(1);
  expect(result.limitCount).toBe(1);
  expect(result.invalidFiles).toEqual([
    { file: fakeFile('large.jpg', 11, 1, 'image/jpeg'), reason: 'oversized' },
    {
      file: fakeFile('report.pdf', 10, 2, 'application/pdf'),
      reason: 'disallowed-type',
    },
  ]);
});

test('rejects files that exceed the configured total size before applying the file count limit', () => {
  const result = appendUniqueFiles(
    [fakeFile('existing.jpg', 7, 1, 'image/jpeg')],
    [
      fakeFile('within-limit.jpg', 3, 2, 'image/jpeg'),
      fakeFile('over-limit.jpg', 1, 3, 'image/jpeg'),
    ],
    3,
    DEFAULT_MAX_FILE_SIZE,
    ['image/*'],
    10,
  );

  expect(result.files.map((file) => file.name)).toEqual([
    'existing.jpg',
    'within-limit.jpg',
  ]);
  expect(result.totalSizeExceededCount).toBe(1);
  expect(result.invalidFiles).toEqual([
    {
      file: fakeFile('over-limit.jpg', 1, 3, 'image/jpeg'),
      reason: 'total-size-exceeded',
    },
  ]);
});
