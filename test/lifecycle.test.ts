import { expect, test } from 'vitest';

import { FieldUp } from '../src/index';
import {
  fakeFieldInput,
  fakeFile,
  FakeElement,
  withDocument,
  withFakeDocument,
} from './setup';

test('allows submission with no selected files and prevents submission with invalid files by default', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({ maxFileSize: '10' }));
    const submit = (
      field as unknown as { handleSubmit(event: SubmitEvent): void }
    ).handleSubmit;
    let noFilesPrevented = false;
    const noFilesEvent = {
      preventDefault: (): void => {
        noFilesPrevented = true;
      },
    } as SubmitEvent;
    submit.call(field, noFilesEvent);
    expect(noFilesPrevented).toBe(false);

    let prevented = false;
    const invalidEvent = {
      preventDefault: (): void => {
        prevented = true;
      },
    } as SubmitEvent;
    (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles.call(field, [fakeFile('large.bin', 11) as File]);
    submit.call(field, invalidEvent);

    expect(prevented).toBe(true);
    field.destroy();
  }));

test('rejects forms that do not use multipart/form-data before initialization', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({});
    const form = input.form as unknown as FakeElement;
    form.enctype = 'application/x-www-form-urlencoded';

    expect(() => new FieldUp(input)).toThrow(
      /FieldUp requires the form to use multipart\/form-data for file submission to work\./,
    );
    expect(form.children).toEqual([input as unknown as FakeElement]);
  }));

test('calls the initialization callback once after rendering and passes the wrapper id', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({});
    const initialized: Array<{ wrapperId: string; rendered: boolean }> = [];
    const field = new FieldUp(input, {
      onInitialized: (wrapperId) => {
        const wrapper = (input.form as unknown as FakeElement).children[0];
        initialized.push({
          wrapperId,
          rendered:
            wrapper?.id === wrapperId &&
            wrapper?.querySelector<FakeElement>('[data-file-list]') !== null,
        });
      },
    });
    const wrapper = (field.form as unknown as FakeElement).children[0];

    expect(initialized).toEqual([
      { wrapperId: wrapper?.id ?? '', rendered: true },
    ]);
    field.destroy();
  }));

test('allows submission with invalid files when preventSubmitIfInvalid is disabled', () =>
  withFakeDocument(() => {
    const field = new FieldUp(fakeFieldInput({ maxFileSize: '10' }), {
      preventSubmitIfInvalid: false,
    });
    const submit = (
      field as unknown as { handleSubmit(event: SubmitEvent): void }
    ).handleSubmit;
    let prevented = false;
    (
      field as unknown as { addFiles(files: readonly File[]): void }
    ).addFiles.call(field, [fakeFile('large.bin', 11) as File]);
    submit.call(field, {
      preventDefault: (): void => {
        prevented = true;
      },
    } as SubmitEvent);

    expect(prevented).toBe(false);
    field.destroy();
  }));

test('honors data-start-collapsed=false over a true constructor option', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({ startCollapsed: 'false' });
    const field = new FieldUp(input, { startCollapsed: true });
    const form = field.form as unknown as FakeElement;
    const fieldRoot = form.children[0];

    expect(fieldRoot).toBeTruthy();
    expect(fieldRoot?.hidden).toBe(false);
    expect(form.children.length).toBe(1);
    field.destroy();
  }));

test('keeps the rendered wrapper visible and does not add a collapse button by default', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({});
    const field = new FieldUp(input);
    const form = field.form as unknown as FakeElement;
    const fieldRoot = form.children[0];

    expect(fieldRoot).toBeTruthy();
    expect(fieldRoot?.hidden).toBe(false);
    expect(form.children.length).toBe(1);
    field.destroy();
  }));

test('renders a collapsed wrapper and removes its reveal button after activation', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({});
    const field = new FieldUp(input, {
      startCollapsed: true,
      startCollapsedButtonLabel: 'Add files',
    });
    const form = field.form as unknown as FakeElement;
    const revealButton = form.children[0];
    const fieldRoot = form.children[1];

    expect(revealButton).toBeTruthy();
    expect(fieldRoot).toBeTruthy();
    expect(revealButton?.textContent).toBe('Add files');
    expect(revealButton?.dataset.expandButton).toBe('');
    expect(fieldRoot?.hidden).toBe(true);

    revealButton?.dispatchEvent(new Event('click'));

    expect(fieldRoot?.hidden).toBe(false);
    expect(form.children).toEqual([fieldRoot]);
    field.destroy();
  }));

test('destroy removes the wrapper and restores the native input state', () =>
  withFakeDocument(() => {
    const input = fakeFieldInput({ disableDropZone: 'true' }, 'image/*');
    input.id = 'existing-input';
    const form = input.form as unknown as FakeElement;
    const originalAriaLabel = input.getAttribute('aria-label');
    const originalAriaLabelledby = input.getAttribute('aria-labelledby');
    const originalAriaDescribedby = input.getAttribute('aria-describedby');
    const field = new FieldUp(input);

    expect(form.children).not.toEqual([input]);
    field.destroy();

    expect(form.children).toEqual([input]);
    expect(input.parentElement).toBe(form);
    expect(input.id).toBe('existing-input');
    expect(input.accept).toBe('image/*');
    expect(input.getAttribute('aria-label')).toBe(originalAriaLabel);
    expect(input.getAttribute('aria-labelledby')).toBe(originalAriaLabelledby);
    expect(input.getAttribute('aria-describedby')).toBe(
      originalAriaDescribedby,
    );
    expect(form.enctype).toBe('multipart/form-data');
  }));

test('mountAll mounts every matching input', () => {
  const input = fakeFieldInput({});

  withDocument(
    {
      createElement: (): FakeElement => new FakeElement(),
      querySelectorAll: () => [input],
    },
    () => {
      const fields = FieldUp.mountAll();

      expect(fields.length).toBe(1);
      expect(fields[0]?.input).toBe(input);
      fields[0]?.destroy();
    },
  );
});

test('auto-mounts inputs marked with data-field-up', () => {
  let selector = '';

  withDocument(
    {
      querySelectorAll: (value: string) => {
        selector = value;
        return [];
      },
    },
    () => {
      expect(FieldUp.mountAll()).toEqual([]);
    },
  );

  expect(selector).toBe('input[type="file"][data-field-up]');
});
