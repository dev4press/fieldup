import { expect, test } from 'vitest';

import { FieldUp } from '../src/index';
import {
  fakeFieldInput,
  fakeFile,
  FakeElement,
  withFakeDocument,
} from './setup';

test('renders the extra drop limit only when a total file size is allowed', () =>
  withFakeDocument(() => {
    const withoutTotalLimit = new FieldUp(fakeFieldInput({}));
    const withoutTotalRoot = (withoutTotalLimit.form as unknown as FakeElement)
      .children[0];
    expect(
      withoutTotalRoot?.querySelector<FakeElement>('[data-file-limit-extra]'),
    ).toBeNull();
    withoutTotalLimit.destroy();

    const input = fakeFieldInput({});
    const field = new FieldUp(input, {
      totalFileSizeAllowed: 5 * 1024,
      dropLimitExtraText: 'Total allowed: {size}',
    });
    const fieldRoot = (field.form as unknown as FakeElement).children[0];
    const extraLimit = fieldRoot?.querySelector<FakeElement>(
      '[data-file-limit-extra]',
    );

    expect(extraLimit?.className).toBe('field-up-drop-limit-extra');
    expect(extraLimit?.textContent).toBe('Total allowed: 5 KB');
    expect(input.getAttribute('aria-describedby') ?? '').toMatch(
      /drop-limit-extra/,
    );
    field.destroy();
  }));

test('renders invalid file cards without accepting them or adding caption controls', () =>
  withFakeDocument(() => {
    const field = new FieldUp(
      fakeFieldInput({
        maxFileSize: '10',
        allowedFileTypes: 'image/*',
      }),
    );
    const addFiles = (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    addFiles.call(field, [
      fakeFile('large.bin', 11, 1) as File,
      fakeFile('report.pdf', 10, 2, 'application/pdf') as File,
    ]);

    const form = field.form as unknown as FakeElement;
    const fieldRoot = form.children[0];
    const fileList = fieldRoot?.querySelector<FakeElement>('[data-file-list]');
    const cards = fileList?.children ?? [];

    expect(field.files.length).toBe(0);
    expect(cards.length).toBe(2);
    expect(cards[0]?.className).toBe(
      'field-up-file-item field-up-file-item-error',
    );
    expect(cards[1]?.className).toBe(
      'field-up-file-item field-up-file-item-error',
    );
    expect(
      cards[0]?.querySelector<FakeElement>('[data-file-error]')?.textContent,
    ).toBe('File is oversized.');
    expect(
      cards[1]?.querySelector<FakeElement>('[data-file-error]')?.textContent,
    ).toBe('File type is not allowed.');
    expect(
      cards[0]?.querySelector<FakeElement>('[data-caption-toggle-index]'),
    ).toBeNull();
    expect(
      cards[1]?.querySelector<FakeElement>('[data-caption-toggle-index]'),
    ).toBeNull();
    field.destroy();
  }));

test('renders caption inputs with an accessible name instead of a caption label', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({}));
    const addFiles = (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    addFiles.call(field, [fakeFile('photo.jpg', 10) as File]);

    const form = field.form as unknown as FakeElement;
    const fieldRoot = form.children[0];
    const fileList = fieldRoot?.querySelector<FakeElement>('[data-file-list]');
    const card = fileList?.querySelector<FakeElement>('[data-file-index]');
    const captionInput = card?.querySelector<FakeElement>(
      '[data-caption-input]',
    );

    expect(captionInput).toBeTruthy();
    expect(captionInput?.getAttribute('aria-label')).toBe(
      'Caption / uploaded name',
    );
    expect(captionInput?.hidden).toBe(true);
    expect(card?.querySelector<FakeElement>('[data-caption-label]')).toBeNull();
    field.destroy();
  }));

test('renders a total-size validation card without accepting the file', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({ totalFileSizeAllowed: '10' }));
    const addFiles = (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    addFiles.call(field, [
      fakeFile('first.bin', 6, 1) as File,
      fakeFile('second.bin', 5, 2) as File,
    ]);

    const form = field.form as unknown as FakeElement;
    const fieldRoot = form.children[0];
    const fileList = fieldRoot?.querySelector<FakeElement>('[data-file-list]');
    const cards = fileList?.children ?? [];

    expect(field.files.length).toBe(1);
    expect(cards.length).toBe(2);
    expect(cards[1]?.className).toBe(
      'field-up-file-item field-up-file-item-error',
    );
    expect(
      cards[1]?.querySelector<FakeElement>('[data-file-error]')?.textContent,
    ).toBe('Total file size limit exceeded.');
    expect(
      cards[1]?.querySelector<FakeElement>('[data-caption-toggle-index]'),
    ).toBeNull();
    field.destroy();
  }));

test('renders and updates selected-files summaries for valid files', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({ maxFileSize: '1024' }));
    const addFiles = (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    addFiles.call(field, [
      fakeFile('first.bin', 1024, 1) as File,
      fakeFile('second.bin', 512, 2) as File,
      fakeFile('invalid.bin', 2048, 3) as File,
    ]);

    const fieldRoot = (field.form as unknown as FakeElement).children[0];
    const summary = fieldRoot?.querySelector<FakeElement>(
      '[data-file-summary]',
    );

    expect(summary?.textContent).toBe('Files: 2 · Size: 1.5 KB');

    (field as unknown as { removeFile(index: number): void }).removeFile(0);
    expect(summary?.textContent).toBe('Files: 1 · Size: 512 B');
    field.destroy();

    const customField = new FieldUp(
      fakeFieldInput({ selectedFilesText: 'Uploads: {files} / {size}' }),
    );
    const addCustomFiles = (
      customField as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    addCustomFiles.call(customField, [fakeFile('upload.bin', 1024) as File]);

    const customRoot = (customField.form as unknown as FakeElement).children[0];
    const customSummary = customRoot?.querySelector<FakeElement>(
      '[data-file-summary]',
    );

    expect(customSummary?.textContent).toBe('Uploads: 1 / 1 KB');
    customField.destroy();
  }));

test('removes a valid file when its rendered remove button is clicked', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({}));
    const addFiles = (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    addFiles.call(field, [fakeFile('photo.jpg', 10) as File]);

    const fieldRoot = (field.form as unknown as FakeElement).children[0];
    const removeButton = fieldRoot?.querySelector<FakeElement>(
      '[data-remove-index]',
    );
    removeButton?.dispatchEvent(new Event('click'));

    expect(field.files.length).toBe(0);
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-file-index]'),
    ).toBeNull();
    field.destroy();
  }));

test('renders the compact picker without a drop-zone wrapper when disabled', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({ disableDropZone: 'true' }), {
      browseButtonLabel: 'Select files',
    });
    const fieldRoot = (field.form as unknown as FakeElement).children[0];
    const pickerArea = fieldRoot?.children[0];
    const pickerControls = pickerArea?.children[0];
    const browseButton = pickerControls?.children[0];

    expect(
      fieldRoot?.querySelector<FakeElement>('[data-drop-zone]'),
    ).toBeNull();
    expect(browseButton?.children[1]?.textContent).toBe('Select files');
    expect(pickerControls?.children[1]?.dataset.fileLimit).toBe('');
    field.destroy();
  }));

test('hides the selected-files list only when it has no valid or invalid files', () =>
  withFakeDocument(() => {
    const field = new FieldUp(
      fakeFieldInput({
        hideSelectedFilesIfEmpty: 'true',
        maxFileSize: '10',
      }),
    );
    const fieldRoot = (field.form as unknown as FakeElement).children[0];
    const selectedFiles = fieldRoot?.querySelector<FakeElement>(
      '[data-selected-files]',
    );
    const addFiles = (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    const removeFile = (field as unknown as { removeFile(index: number): void })
      .removeFile;
    const removeInvalidFile = (
      field as unknown as { removeInvalidFile(index: number): void }
    ).removeInvalidFile;

    expect(selectedFiles?.hidden).toBe(true);

    addFiles.call(field, [fakeFile('large.bin', 11) as File]);
    expect(selectedFiles?.hidden).toBe(false);
    removeInvalidFile.call(field, 0);
    expect(selectedFiles?.hidden).toBe(true);

    addFiles.call(field, [fakeFile('small.bin', 10) as File]);
    expect(selectedFiles?.hidden).toBe(false);
    removeFile.call(field, 0);
    expect(selectedFiles?.hidden).toBe(true);
    field.destroy();
  }));

test('calls valid-file callbacks and custom action handlers with file information', () =>
  withFakeDocument(() => {
    const file = fakeFile('photo.jpg', 10) as File;
    const added: Array<{ file: File; wrapperId: string }> = [];
    const removed: Array<{ file: File; wrapperId: string }> = [];
    const actionFiles: Array<{ file: File; wrapperId: string }> = [];
    const field = new FieldUp(fakeFieldInput({}), {
      disableCaptionAction: true,
      actions: [
        {
          class: 'download-action',
          label: 'Download',
          handler: (actionFile, wrapperId) =>
            actionFiles.push({ file: actionFile, wrapperId }),
        },
      ],
      onFileAdded: (addedFile, wrapperId) =>
        added.push({ file: addedFile, wrapperId }),
      onFileRemoved: (removedFile, wrapperId) =>
        removed.push({ file: removedFile, wrapperId }),
    });
    const addFiles = (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles;
    addFiles.call(field, [file]);

    const fieldRoot = (field.form as unknown as FakeElement).children[0];
    const wrapperId = fieldRoot?.id ?? '';
    const card = fieldRoot?.querySelector<FakeElement>('[data-file-index]');
    const actions = card?.querySelector<FakeElement>('[data-actions]');
    actions?.children[0]?.dispatchEvent(new Event('click'));
    (field as unknown as { removeFile(index: number): void }).removeFile(0);

    expect(added).toEqual([{ file, wrapperId }]);
    expect(actionFiles).toEqual([{ file, wrapperId }]);
    expect(removed).toEqual([{ file, wrapperId }]);
    field.destroy();
  }));
