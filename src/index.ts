import './styles.scss';

import {
  appendUniqueFiles,
  getDefaultCaption,
  getFileKey,
  formatBytes,
  formatDropLimit,
  formatTemplate,
  queryRequired,
} from './utils';
import { createFieldMarkup, createFileCard } from './render';
import { prepareSettings } from './settings';
import type {
  FieldUpOptions,
  FieldUpSettings,
  InvalidSelectedFile,
  SelectedFile,
} from './types';

export * from './utils';
export type * from './types';

let fieldInstanceCount = 0;

/** Coordinates the FieldUp upload field, its native input, and selected-file state. */
export class FieldUp {
  public readonly form: HTMLFormElement;

  public readonly input: HTMLInputElement;
  private readonly selectedFiles: HTMLElement;
  private readonly fileList: HTMLElement;
  private readonly emptyState: HTMLElement;
  private readonly fileSummary: HTMLElement;
  private readonly fieldRoot: HTMLDivElement;
  private readonly dropZone: HTMLElement | null;
  private readonly limitLabel: HTMLElement;
  private readonly extraLimitLabel: HTMLElement | null;
  private readonly settings: FieldUpSettings;
  private readonly instanceId = `field-up-${++fieldInstanceCount}`;
  private readonly wrapperId: string;
  private readonly items: SelectedFile[] = [];
  private readonly invalidItems: InvalidSelectedFile[] = [];
  private readonly previewUrls: string[] = [];
  private readonly eventController = new AbortController();
  private readonly originalInputId: string;
  private readonly originalInputAccept: string;
  private readonly originalInputAriaLabel: string | null;
  private readonly originalInputAriaLabelledby: string | null;
  private readonly originalInputAriaDescribedby: string | null;

  /** Creates and renders a FieldUp instance for a file input in a multipart form. */
  public constructor(input: HTMLInputElement, options: FieldUpOptions = {}) {
    if (input.type !== 'file') {
      throw new Error('FieldUp requires a file upload input.');
    }

    const form = input.form;
    if (!form) {
      throw new Error(
        'FieldUp requires the file upload input to belong to a form.',
      );
    }
    if (form.enctype.trim().toLowerCase() !== 'multipart/form-data') {
      throw new Error(
        'FieldUp requires the form to use multipart/form-data for file submission to work.',
      );
    }

    this.form = form;
    this.input = input;
    this.originalInputId = input.id;
    this.originalInputAccept = input.accept;
    this.originalInputAriaLabel = input.getAttribute('aria-label');
    this.originalInputAriaLabelledby = input.getAttribute('aria-labelledby');
    this.originalInputAriaDescribedby = input.getAttribute('aria-describedby');
    this.settings = prepareSettings(this.input, options);
    this.fieldRoot = createFieldMarkup(
      input,
      this.settings,
      this.instanceId,
      this.eventController.signal,
    );
    this.wrapperId = this.fieldRoot.id;
    this.selectedFiles = queryRequired<HTMLElement>(
      this.fieldRoot,
      '[data-selected-files]',
    );
    this.fileList = queryRequired<HTMLElement>(
      this.fieldRoot,
      '[data-file-list]',
    );
    this.emptyState = queryRequired<HTMLElement>(
      this.fieldRoot,
      '[data-empty-state]',
    );
    this.fileSummary = queryRequired<HTMLElement>(
      this.fieldRoot,
      '[data-file-summary]',
    );
    this.dropZone =
      this.fieldRoot.querySelector<HTMLElement>('[data-drop-zone]');
    this.limitLabel = queryRequired<HTMLElement>(
      this.fieldRoot,
      '[data-file-limit]',
    );
    this.extraLimitLabel = this.fieldRoot.querySelector<HTMLElement>(
      '[data-file-limit-extra]',
    );
    this.configureLimit();
    this.bindEvents();
    this.render();
    this.settings.onInitialized?.(this.wrapperId);
  }

  /** Mounts FieldUp on every matching file input in the current document. */
  public static mountAll(
    selector = 'input[type="file"][data-field-up]',
    options?: FieldUpOptions,
  ): FieldUp[] {
    if (typeof document === 'undefined') {
      return [];
    }

    return Array.from(
      document.querySelectorAll<HTMLInputElement>(selector),
      (input) => new FieldUp(input, options),
    );
  }

  /** Returns a snapshot of the currently accepted files and their captions. */
  public get files(): readonly SelectedFile[] {
    return this.items.map((item) => ({ ...item }));
  }

  /** Removes registered event listeners and releases all preview object URLs. */
  public destroy(): void {
    this.eventController.abort();
    this.revokePreviewUrls();

    const parent = this.fieldRoot.parentElement;
    const expandButton = this.fieldRoot.previousElementSibling;
    if (parent) {
      parent.insertBefore(this.input, this.fieldRoot);
      if (
        expandButton &&
        expandButton.getAttribute('data-expand-button') !== null
      ) {
        parent.removeChild(expandButton);
      }
      parent.removeChild(this.fieldRoot);
    }

    this.input.id = this.originalInputId;
    this.input.accept = this.originalInputAccept;
    this.restoreInputAttribute('aria-label', this.originalInputAriaLabel);
    this.restoreInputAttribute(
      'aria-labelledby',
      this.originalInputAriaLabelledby,
    );
    this.restoreInputAttribute(
      'aria-describedby',
      this.originalInputAriaDescribedby,
    );
  }

  /** Restores an input attribute captured before FieldUp rendered its UI. */
  private restoreInputAttribute(name: string, value: string | null): void {
    if (value === null) {
      this.input.removeAttribute(name);
    } else {
      this.input.setAttribute(name, value);
    }
  }

  /** Applies the accepted-file limits to the native input and rendered labels. */
  private configureLimit(): void {
    if (this.settings.allowedFileTypes.length > 0) {
      this.input.accept = this.settings.allowedFileTypes.join(',');
    }

    this.limitLabel.textContent = formatDropLimit(
      this.settings.dropLimitText,
      this.settings.maxFiles,
      this.settings.maxFileSize,
      this.settings.allowedFileTypes,
      this.settings.allFileTypesText,
    );
    if (this.extraLimitLabel && this.settings.totalFileSizeAllowed !== null) {
      this.extraLimitLabel.textContent = formatTemplate(
        this.settings.dropLimitExtraText,
        {
          size: formatBytes(this.settings.totalFileSizeAllowed),
        },
      );
    }
    if (this.settings.maxFiles === 1) {
      this.input.removeAttribute('multiple');
    }
  }

  /** Registers all input, file-list, form, and drag-and-drop event listeners. */
  private bindEvents(): void {
    const { signal } = this.eventController;

    this.input.addEventListener('change', this.handleInputChange, { signal });
    this.fileList.addEventListener('click', this.handleFileListClick, {
      signal,
    });
    this.fileList.addEventListener('input', this.handleFileListInput, {
      signal,
    });
    this.form.addEventListener('submit', this.handleSubmit, { signal });
    this.dropZone?.addEventListener('dragenter', this.handleDragEnter, {
      signal,
    });
    this.dropZone?.addEventListener('dragover', this.handleDragEnter, {
      signal,
    });
    this.dropZone?.addEventListener('dragleave', this.handleDragLeave, {
      signal,
    });
    this.dropZone?.addEventListener('drop', this.handleDragLeave, { signal });
    this.dropZone?.addEventListener('drop', this.handleDrop, { signal });
  }

  /** Adds files selected through the native file picker. */
  private readonly handleInputChange = (): void => {
    this.addFiles(Array.from(this.input.files ?? []));
  };

  /** Dispatches clicks in the delegated file-list controls. */
  private readonly handleFileListClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const invalidRemoveButton = target.closest('[data-remove-invalid-index]');
    if (invalidRemoveButton) {
      this.removeInvalidFile(
        Number.parseInt(
          invalidRemoveButton.getAttribute('data-remove-invalid-index') ?? '',
          10,
        ),
      );
      return;
    }

    const captionToggle = target.closest('[data-caption-toggle-index]');
    if (captionToggle) {
      this.toggleCaption(
        Number.parseInt(
          captionToggle.getAttribute('data-caption-toggle-index') ?? '',
          10,
        ),
      );
      return;
    }

    const removeButton = target.closest('[data-remove-index]');
    if (!removeButton) {
      return;
    }

    this.removeFile(
      Number.parseInt(removeButton.getAttribute('data-remove-index') ?? '', 10),
    );
  };

  /** Stores edits made to an accepted file's caption input. */
  private readonly handleFileListInput = (event: Event): void => {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) ||
      !target.matches('[data-caption-index]')
    ) {
      return;
    }

    const index = Number.parseInt(
      target.getAttribute('data-caption-index') ?? '',
      10,
    );
    if (this.items[index]) {
      this.items[index].caption = target.value;
    }
  };

  /** Blocks invalid submissions when configured and synchronizes valid native files. */
  private readonly handleSubmit = (event: SubmitEvent): void => {
    if (this.settings.preventSubmitIfInvalid && this.invalidItems.length > 0) {
      event.preventDefault();
      this.input.focus();
      return;
    }

    // Keep the native multipart form submission. No request is made during selection.
    this.syncInputFiles();
  };

  /** Prevents the browser default and marks the drop zone as active. */
  private readonly handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    this.dropZone?.classList.add('field-up-is-dragging');
  };

  /** Prevents the browser default and clears the active drop-zone state. */
  private readonly handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    this.dropZone?.classList.remove('field-up-is-dragging');
  };

  /** Adds files supplied by a drag-and-drop operation. */
  private readonly handleDrop = (event: DragEvent): void => {
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  };

  /** Validates, deduplicates, stores, and renders a batch of incoming files. */
  private addFiles(incomingFiles: readonly File[]): void {
    const result = appendUniqueFiles(
      this.items.map((item) => item.file),
      incomingFiles,
      this.settings.maxFiles,
      this.settings.maxFileSize,
      this.settings.allowedFileTypes,
      this.settings.totalFileSizeAllowed,
    );
    const existingKeys = new Set(
      this.items.map((item) => getFileKey(item.file)),
    );
    this.invalidItems.forEach((item) =>
      existingKeys.add(getFileKey(item.file)),
    );

    for (const file of result.files) {
      if (!existingKeys.has(getFileKey(file))) {
        this.items.push({
          file: file as File,
          caption: getDefaultCaption(file.name),
        });
        existingKeys.add(getFileKey(file));
        this.settings.onFileAdded?.(file as File, this.wrapperId);
      }
    }

    for (const invalidFile of result.invalidFiles) {
      if (!existingKeys.has(getFileKey(invalidFile.file))) {
        this.invalidItems.push({
          file: invalidFile.file as File,
          reason: invalidFile.reason,
        });
        existingKeys.add(getFileKey(invalidFile.file));
      }
    }

    this.syncInputFiles();
    this.render();
  }

  /** Removes an accepted file and notifies the configured removal callback. */
  private removeFile(index: number): void {
    if (!Number.isInteger(index) || !this.items[index]) {
      return;
    }

    const [removedItem] = this.items.splice(index, 1);
    if (!removedItem) {
      return;
    }
    this.syncInputFiles();
    this.settings.onFileRemoved?.(removedItem.file, this.wrapperId);
    this.render();
  }

  /** Removes an invalid file card without affecting native accepted files. */
  private removeInvalidFile(index: number): void {
    if (!Number.isInteger(index) || !this.invalidItems[index]) {
      return;
    }

    this.invalidItems.splice(index, 1);
    this.render();
  }

  /** Toggles and focuses the caption input for an accepted file card. */
  private toggleCaption(index: number): void {
    if (!Number.isInteger(index)) {
      return;
    }

    const card = this.fileList.querySelector<HTMLElement>(
      `[data-file-index="${index}"]`,
    );
    const captionInput = card?.querySelector<HTMLInputElement>(
      '[data-caption-input]',
    );
    const toggle = card?.querySelector<HTMLButtonElement>(
      '[data-caption-toggle-index]',
    );
    if (!captionInput || !toggle) {
      return;
    }

    const showCaption = captionInput.hidden;
    captionInput.hidden = !showCaption;
    toggle.setAttribute('aria-expanded', String(showCaption));
    toggle.textContent = showCaption
      ? this.settings.hideCaptionActionLabel
      : this.settings.captionActionLabel;
    if (showCaption) {
      captionInput.focus();
    }
  }

  /** Copies accepted files into the native input using a DataTransfer object. */
  private syncInputFiles(): void {
    if (typeof DataTransfer === 'undefined') {
      return;
    }

    const transfer = new DataTransfer();
    for (const item of this.items) {
      transfer.items.add(item.file);
    }

    this.input.value = '';
    this.input.files = transfer.files;
  }

  /** Rebuilds selected-file cards, empty state, visibility, and summary text. */
  private render(): void {
    this.revokePreviewUrls();
    this.fileList.replaceChildren();
    const renderedFileCount = this.items.length + this.invalidItems.length;
    this.selectedFiles.hidden =
      this.settings.hideSelectedFilesIfEmpty && renderedFileCount === 0;
    this.emptyState.hidden = renderedFileCount > 0;

    if (renderedFileCount === 0) {
      this.fileList.append(this.emptyState);
    }

    const renderContext = {
      instanceId: this.instanceId,
      wrapperId: this.wrapperId,
      captionName: this.settings.captionName,
      previewUrls: this.previewUrls,
      settings: this.settings,
    };
    this.items.forEach((item, index) => {
      this.fileList.append(createFileCard(item, index, renderContext));
    });
    this.invalidItems.forEach((item, index) => {
      this.fileList.append(createFileCard(item, index, renderContext, true));
    });

    const totalFileSize = this.items.reduce(
      (size, item) => size + item.file.size,
      0,
    );
    this.fileSummary.textContent = formatTemplate(
      this.settings.selectedFilesText,
      {
        files: this.items.length,
        size: formatBytes(totalFileSize),
      },
    ).replaceAll('&middot;', '·');
  }

  /** Revokes every preview URL currently owned by this instance. */
  private revokePreviewUrls(): void {
    this.previewUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    this.previewUrls.length = 0;
  }
}
