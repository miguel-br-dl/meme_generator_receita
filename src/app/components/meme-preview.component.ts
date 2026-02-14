import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemeTemplate } from '../models/template.model';

@Component({
  selector: 'app-meme-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-shell" *ngIf="template as tpl; else emptyState">
      <article #previewCard class="iphone" [style.background-image]="'url(' + tpl.assets.background + ')'">
        <div class="iphone-overlay" aria-hidden="true"></div>
        <div class="status-bar">
          <div>📶</div>
          <div class="battery">
            <span>{{ tpl.preview.battery }}</span>
            <div class="battery-icon">
              <div class="battery-level"></div>
              <div class="battery-tip" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <div class="time">
          <h1>{{ tpl.preview.time }}</h1>
          <span>{{ tpl.preview.subtitle }}</span>
        </div>

        <div class="notifications">
          <div class="notification" *ngFor="let slot of tpl.notifications">
            <div class="badge">
              <img [src]="tpl.assets.appIcon" alt="App" />
            </div>
            <div class="notification-content">
              <div class="notification-header">
                <strong>{{ resolve(slot.titleKey) }}</strong>
                <span class="notification-time">{{ slot.timeLabel || tpl.preview.notificationTime }}</span>
              </div>
              <div class="notification-text">{{ resolve(slot.textKey) }}</div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <ng-template #emptyState>
      <p class="empty-state">Selecione um template para pré-visualizar.</p>
    </ng-template>
  `,
  styles: [
    `
      .preview-shell {
        display: flex;
        justify-content: center;
        padding: 0.5rem;
      }

      .iphone {
        width: min(390px, 100%);
        aspect-ratio: 390 / 644;
        border-radius: 40px;
        color: #fff;
        padding: 24px 20px;
        position: relative;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
      }

      .iphone-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        z-index: 0;
        pointer-events: none;
      }

      .iphone > :not(.iphone-overlay) {
        position: relative;
        z-index: 1;
      }

      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }

      .battery {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .battery-icon {
        width: 22px;
        height: 10px;
        border: 1.5px solid #fff;
        border-radius: 3px;
        position: relative;
      }

      .battery-tip {
        position: absolute;
        right: -4px;
        top: 2px;
        width: 2px;
        height: 6px;
        background: #fff;
        border-radius: 1px;
      }

      .battery-level {
        width: 90%;
        height: 100%;
        background: #4cd964;
        border-radius: 2px;
      }

      .time {
        margin-top: 40px;
        text-align: center;
      }

      .time h1 {
        font-size: clamp(3rem, 8vw, 4.5rem);
        font-weight: 300;
        margin: 0;
      }

      .time span {
        font-size: 20px;
        opacity: 0.85;
      }

      .notifications {
        margin-top: 40px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .notification {
        background: rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(14px);
        border-radius: 18px;
        padding: 14px;
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .badge {
        width: 45px;
        height: 45px;
        border-radius: 10px;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
      }

      .badge img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .notification-content {
        flex: 1;
      }

      .notification-header {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        margin-bottom: 4px;
        gap: 8px;
      }

      .notification-header strong {
        font-weight: 600;
      }

      .notification-time {
        font-size: 12px;
        opacity: 0.75;
        white-space: nowrap;
      }

      .notification-text {
        font-size: 14px;
        opacity: 0.9;
      }

      .empty-state {
        margin: 0;
        color: #64748b;
      }
    `
  ]
})
export class MemePreviewComponent {
  @Input() template: MemeTemplate | null = null;
  @Input() values: Record<string, string> = {};
  @ViewChild('previewCard') private previewCard?: ElementRef<HTMLElement>;
  private readonly assetDataUrlCache = new Map<string, Promise<string>>();

  resolve(key: string): string {
    return this.values[key] ?? this.template?.defaults[key] ?? '';
  }

  async renderPngBlob(): Promise<Blob> {
    const element = this.previewCard?.nativeElement;

    if (!element) {
      throw new Error('Preview indisponivel para exportacao.');
    }

    await this.waitForImages(element);

    const bounds = element.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const clonedNode = await this.cloneWithInlineStyles(element);
    const serialized = new XMLSerializer().serializeToString(clonedNode);
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      '<foreignObject width="100%" height="100%">',
      `<div xmlns="http://www.w3.org/1999/xhtml">${serialized}</div>`,
      '</foreignObject>',
      '</svg>'
    ].join('');

    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const renderedImage = await this.loadImage(dataUrl);
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas indisponivel para exportacao.');
    }

    context.scale(scale, scale);
    context.drawImage(renderedImage, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
          return;
        }

        reject(new Error('Falha ao converter imagem.'));
      }, 'image/png');
    });

    return blob;
  }

  private async cloneWithInlineStyles(element: HTMLElement): Promise<HTMLElement> {
    const clone = element.cloneNode(true) as HTMLElement;
    this.inlineStylesRecursively(element, clone);
    await this.embedExternalAssetsRecursively(element, clone);
    return clone;
  }

  private inlineStylesRecursively(source: Element, target: Element): void {
    const sourceStyle = window.getComputedStyle(source);
    const styleDeclaration: string[] = [];

    for (let index = 0; index < sourceStyle.length; index += 1) {
      const property = sourceStyle.item(index);
      styleDeclaration.push(`${property}:${sourceStyle.getPropertyValue(property)};`);
    }

    (target as HTMLElement).setAttribute('style', styleDeclaration.join(''));

    const sourceChildren = Array.from(source.children);
    const targetChildren = Array.from(target.children);

    for (let index = 0; index < sourceChildren.length; index += 1) {
      const sourceChild = sourceChildren[index];
      const targetChild = targetChildren[index];

      if (sourceChild && targetChild) {
        this.inlineStylesRecursively(sourceChild, targetChild);
      }
    }
  }

  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'));
    const pending = images
      .filter((image) => !image.complete)
      .map(
        (image) =>
          new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          })
      );

    if (pending.length) {
      await Promise.all(pending);
    }
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Falha ao renderizar imagem para download.'));
      image.src = source;
    });
  }

  private async embedExternalAssetsRecursively(source: Element, target: Element): Promise<void> {
    await this.embedBackgroundImages(target as HTMLElement);

    if (source instanceof HTMLImageElement && target instanceof HTMLImageElement) {
      await this.embedImageSource(source, target);
    }

    const sourceChildren = Array.from(source.children);
    const targetChildren = Array.from(target.children);
    const pending: Array<Promise<void>> = [];

    for (let index = 0; index < sourceChildren.length; index += 1) {
      const sourceChild = sourceChildren[index];
      const targetChild = targetChildren[index];

      if (sourceChild && targetChild) {
        pending.push(this.embedExternalAssetsRecursively(sourceChild, targetChild));
      }
    }

    if (pending.length) {
      await Promise.all(pending);
    }
  }

  private async embedImageSource(source: HTMLImageElement, target: HTMLImageElement): Promise<void> {
    const originalSource = source.currentSrc || source.src;

    if (!originalSource) {
      return;
    }

    try {
      const dataUrl = await this.toDataUrl(originalSource);
      target.src = dataUrl;
      target.removeAttribute('srcset');
    } catch {
      // Keep original source if conversion fails.
    }
  }

  private async embedBackgroundImages(target: HTMLElement): Promise<void> {
    const originalBackground = target.style.backgroundImage;

    if (!originalBackground || originalBackground === 'none') {
      return;
    }

    const matches = Array.from(originalBackground.matchAll(/url\((['"]?)(.*?)\1\)/g));

    if (!matches.length) {
      return;
    }

    let nextBackground = originalBackground;

    for (const match of matches) {
      const fullMatch = match[0];
      const sourceUrl = match[2];

      if (!sourceUrl || sourceUrl.startsWith('data:')) {
        continue;
      }

      try {
        const dataUrl = await this.toDataUrl(sourceUrl);
        nextBackground = nextBackground.replace(fullMatch, `url("${dataUrl}")`);
      } catch {
        // Keep original URL if conversion fails.
      }
    }

    target.style.backgroundImage = nextBackground;
  }

  private toDataUrl(url: string): Promise<string> {
    if (url.startsWith('data:')) {
      return Promise.resolve(url);
    }

    const absoluteUrl = new URL(url, window.location.href).href;
    const cached = this.assetDataUrlCache.get(absoluteUrl);

    if (cached) {
      return cached;
    }

    const pending = this.fetchAsDataUrl(absoluteUrl);
    this.assetDataUrlCache.set(absoluteUrl, pending);
    return pending;
  }

  private async fetchAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Falha ao carregar asset para exportacao: ${url}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Falha ao converter asset em data URL.'));
      reader.readAsDataURL(blob);
    });
  }
}
