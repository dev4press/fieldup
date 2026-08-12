import { expect, test } from 'vitest';

import { FieldUp, type FieldUpSettings } from '../src/index';
import { fakeFieldInput, FakeElement, withFakeDocument } from './setup';

test('gives data attributes priority over constructor options', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput(
      {
        maxFiles: '2',
        maxFileSize: '10',
        allowedFileTypes: 'image/*',
        captionName: 'data_captions',
        wrapperClass: 'data-upload-field',
        startCollapsed: 'true',
        startCollapsedButtonLabel: 'Open uploads',
      },
      'application/pdf',
    );
    const field = new FieldUp(input, {
      maxFiles: 8,
      maxFileSize: 20,
      allowedFileTypes: ['text/plain'],
      captionName: 'option_captions',
      wrapperClass: 'option-upload-field',
      startCollapsed: false,
      startCollapsedButtonLabel: 'Choose files',
      dropAreaTitleText: 'Drop media',
      dropAreaHintText: 'PNG or PDF',
      dropAreaIcon: '<svg data-test-icon></svg>',
      selectedFilesTitleText: 'Your files',
      noFilesSelectedText: 'Nothing here yet.',
      totalFileSizeAllowed: 20,
    });
    const settings = (
      field as unknown as {
        settings: {
          maxFiles: number;
          maxFileSize: number;
          totalFileSizeAllowed: number | null;
          allowedFileTypes: string[];
          captionName: string;
        };
      }
    ).settings;
    const form = field.form as unknown as FakeElement;
    const expandButton = form.children[0];
    const fieldRoot = form.children[1];

    expect(expandButton).toBeTruthy();
    expect(fieldRoot).toBeTruthy();
    expect(expandButton?.textContent).toBe('Open uploads');
    expect(fieldRoot?.className).toBe('field-up-wrapper data-upload-field');
    expect(fieldRoot?.hidden).toBe(true);
    expect(settings.maxFiles).toBe(2);
    expect(settings.maxFileSize).toBe(10);
    expect(settings.totalFileSizeAllowed).toBe(20);
    expect(settings.allowedFileTypes).toEqual(['image/*']);
    expect(settings.captionName).toBe('data_captions[]');
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-drop-zone]')?.children[1]
        ?.textContent,
    ).toBe('Drop media');
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-drop-zone]')?.children[2]
        ?.textContent,
    ).toBe('PNG or PDF');
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-drop-zone]')?.children[0]
        ?.innerHTML,
    ).toBe('<svg data-test-icon></svg>');
    expect(fieldRoot?.children[1]?.children[0]?.children[0]?.textContent).toBe(
      'Your files',
    );
    expect(
      fieldRoot?.children[1]?.children[0]?.children[0]?.getAttribute('role'),
    ).toBe('heading');
    expect(
      fieldRoot?.children[1]?.children[0]?.children[0]?.getAttribute(
        'aria-level',
      ),
    ).toBe('2');
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-file-list]')?.children[0]
        ?.textContent,
    ).toBe('Nothing here yet.');
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-form-status]'),
    ).toBeNull();
    field.destroy();
  }));

test('gives individual data attributes priority over JSON options and constructor options', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({
      options: JSON.stringify({
        maxFiles: 6,
        dropAreaTitleText: 'JSON title',
        fileCountText: { singular: 'JSON file', plural: '{count} JSON files' },
        selectedFilesText: 'JSON: {files} / {size}',
        totalFileSizeAllowed: 10240,
        dropLimitExtraText: 'JSON total: {size}',
        hideSelectedFilesIfEmpty: false,
        preventSubmitIfInvalid: false,
      }),
      maxFiles: '2',
      fileCountTextSingular: 'One selected file',
      selectedFilesText: 'Data: {files} / {size}',
      dropLimitExtraText: 'Data total: {size}',
      preventSubmitIfInvalid: 'true',
    });
    const field = new FieldUp(input, {
      maxFiles: 9,
      dropAreaTitleText: 'Option title',
      selectedFilesText: 'Option: {files} / {size}',
      dropLimitExtraText: 'Option total: {size}',
      hideSelectedFilesIfEmpty: false,
      preventSubmitIfInvalid: false,
    });
    const settings = (field as unknown as { settings: FieldUpSettings })
      .settings;
    const fieldRoot = (field.form as unknown as FakeElement).children[0];

    expect(settings.maxFiles).toBe(2);
    expect(settings.dropAreaTitleText).toBe('JSON title');
    expect(settings.fileCountText.singular).toBe('One selected file');
    expect(settings.fileCountText.plural).toBe('{count} JSON files');
    expect(settings.selectedFilesText).toBe('Data: {files} / {size}');
    expect(settings.dropLimitExtraText).toBe('Data total: {size}');
    expect(settings.hideSelectedFilesIfEmpty).toBe(false);
    expect(settings.preventSubmitIfInvalid).toBe(true);
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-drop-zone]')?.children[1]
        ?.textContent,
    ).toBe('JSON title');
    expect(
      fieldRoot?.querySelector<FakeElement>('[data-file-limit-extra]')
        ?.textContent,
    ).toBe('Data total: 10 KB');
    field.destroy();
  }));

test('uses the data total size limit and defaults it to no limit', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({ totalFileSizeAllowed: '10' });
    const field = new FieldUp(input, { totalFileSizeAllowed: 20 });
    const settings = (
      field as unknown as {
        settings: { totalFileSizeAllowed: number | null };
      }
    ).settings;

    expect(settings.totalFileSizeAllowed).toBe(10);
    field.destroy();

    const defaultField = new FieldUp(fakeFieldInput({}));
    const defaultSettings = (
      defaultField as unknown as {
        settings: { totalFileSizeAllowed: number | null };
      }
    ).settings;
    expect(defaultSettings.totalFileSizeAllowed).toBeNull();
    defaultField.destroy();
  }));

test('gracefully ignores malformed JSON options', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({ options: '{"maxFiles":' }), {
      maxFiles: 7,
    });
    const settings = (field as unknown as { settings: FieldUpSettings })
      .settings;

    expect(settings.maxFiles).toBe(7);
    field.destroy();
  }));
