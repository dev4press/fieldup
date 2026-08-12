import type { FileLike } from '../src/types';

export function fakeFile(
  name: string,
  size: number,
  lastModified = 1,
  type = 'application/octet-stream',
): FileLike {
  return { name, size, lastModified, type };
}

export class FakeElement {
  public readonly children: FakeElement[] = [];
  public readonly dataset: Record<string, string> = {};
  public readonly classList = {
    add: (): void => {},
    remove: (): void => {},
  };
  public parentElement: FakeElement | null = null;
  public className = '';
  public hidden = false;
  public id = '';
  public innerHTML = '';
  public textContent = '';
  public type = '';
  public value = '';
  public form: FakeElement | null = null;
  public enctype = 'multipart/form-data';
  public accept = '';
  private readonly attributes = new Map<string, string>();
  private readonly listeners = new Map<string, EventListener[]>();

  public append(...children: unknown[]): void {
    children.forEach((child) => {
      if (!(child instanceof FakeElement)) {
        return;
      }

      child.parentElement?.removeChild(child);
      child.parentElement = this;
      this.children.push(child);
    });
  }

  public insertBefore(child: FakeElement, reference: FakeElement): void {
    const index = this.children.indexOf(reference);
    child.parentElement?.removeChild(child);
    child.parentElement = this;
    this.children.splice(index < 0 ? this.children.length : index, 0, child);
  }

  public removeChild(child: FakeElement): void {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentElement = null;
    }
  }

  public querySelector<T extends FakeElement>(selector: string): T | null {
    for (const child of this.children) {
      if (child.attributes.has(selector)) {
        return child as T;
      }

      const descendant = child.querySelector<T>(selector);
      if (descendant) {
        return descendant;
      }
    }

    return null;
  }

  public closest<T extends FakeElement>(selector: string): T | null {
    if (this.attributes.has(selector)) {
      return this as unknown as T;
    }

    return this.parentElement?.closest<T>(selector) ?? null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(`[${name}]`, value);
    if (name.startsWith('data-')) {
      const datasetKey = name
        .slice(5)
        .replace(/-([a-z])/g, (_, character: string) =>
          character.toUpperCase(),
        );
      this.dataset[datasetKey] = value;
    }
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(`[${name}]`) ?? null;
  }

  public addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  public dispatchEvent(event: Event): boolean {
    if (!event.target) {
      Object.defineProperty(event, 'target', {
        configurable: true,
        value: this,
      });
    }
    this.listeners
      .get(event.type)
      ?.forEach((listener) => listener.call(this, event));
    this.parentElement?.dispatchEvent(event);
    return true;
  }

  public replaceChildren(...children: unknown[]): void {
    this.children.splice(0);
    this.append(...children);
  }

  public removeAttribute(name: string): void {
    this.attributes.delete(`[${name}]`);
    if (name.startsWith('data-')) {
      const datasetKey = name
        .slice(5)
        .replace(/-([a-z])/g, (_, character: string) =>
          character.toUpperCase(),
        );
      delete this.dataset[datasetKey];
    }
  }

  public get previousElementSibling(): FakeElement | null {
    const siblings = this.parentElement?.children ?? [];
    const index = siblings.indexOf(this);
    return index > 0 ? (siblings[index - 1] ?? null) : null;
  }

  public focus(): void {}
}

export function fakeFieldInput(
  dataset: Record<string, string>,
  accept = '',
): HTMLInputElement {
  const form = new FakeElement();
  const input = new FakeElement();
  Object.assign(input.dataset, dataset);
  input.type = 'file';
  input.form = form;
  input.accept = accept;
  form.append(input);

  return input as unknown as HTMLInputElement;
}

export function withDocument<T>(documentValue: unknown, callback: () => T): T {
  const originalDocument = globalThis.document;
  const originalElement = globalThis.Element;
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: documentValue,
  });
  Object.defineProperty(globalThis, 'Element', {
    configurable: true,
    value: FakeElement,
  });

  try {
    return callback();
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    });
    Object.defineProperty(globalThis, 'Element', {
      configurable: true,
      value: originalElement,
    });
  }
}

export function withFakeDocument<T>(callback: () => T): T {
  return withDocument(
    { createElement: (): FakeElement => new FakeElement() },
    callback,
  );
}
