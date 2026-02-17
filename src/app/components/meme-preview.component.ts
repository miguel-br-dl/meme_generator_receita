import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemeTemplate } from '../models/template.model';

@Component({
  selector: 'app-meme-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meme-preview.component.html',
  styleUrls: ['./meme-preview.component.css']
})
export class MemePreviewComponent {
  @Input() template: MemeTemplate | null = null;
  @Input() values: Record<string, string> = {};
  @ViewChild('previewCard') private previewCard?: ElementRef<HTMLElement>;
  private readonly assetDataUrlCache = new Map<string, Promise<string>>();

  resolve(key: string): string {
    const raw = this.values[key] ?? this.template?.defaults[key] ?? '';
    return this.interpolateTemplateText(raw);
  }

  isDescanseLayout(): boolean {
    return this.template?.layout === 'descanse';
  }

  async renderPngBlob(scale = 2): Promise<Blob> {
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

  async renderWhatsAppPngBlob(): Promise<Blob> {
    const previewBlob = await this.renderPngBlob(3);
    const previewImage = await this.loadImage(await this.blobToDataUrl(previewBlob));
    const targetSize = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas indisponivel para exportacao do formato WhatsApp.');
    }

    const backgroundScale = Math.max(targetSize / previewImage.width, targetSize / previewImage.height);
    const backgroundWidth = previewImage.width * backgroundScale;
    const backgroundHeight = previewImage.height * backgroundScale;
    const backgroundX = (targetSize - backgroundWidth) / 2;
    const backgroundY = (targetSize - backgroundHeight) / 2;

    context.save();
    context.filter = 'blur(26px) saturate(0.88) brightness(0.72)';
    context.drawImage(previewImage, backgroundX, backgroundY, backgroundWidth, backgroundHeight);
    context.restore();

    context.fillStyle = 'rgba(0, 0, 0, 0.24)';
    context.fillRect(0, 0, targetSize, targetSize);

    const padding = Math.round(targetSize * 0.07);
    const maxWidth = targetSize - padding * 2;
    const maxHeight = targetSize - padding * 2;
    const previewScale = Math.min(maxWidth / previewImage.width, maxHeight / previewImage.height);
    const cardWidth = previewImage.width * previewScale;
    const cardHeight = previewImage.height * previewScale;
    const cardX = (targetSize - cardWidth) / 2;
    const cardY = (targetSize - cardHeight) / 2;
    const cornerRadius = Math.max(12, Math.min(cardWidth, cardHeight) * 0.045);

    context.save();
    this.drawRoundedRectPath(context, cardX, cardY, cardWidth, cardHeight, cornerRadius);
    context.clip();
    context.drawImage(previewImage, cardX, cardY, cardWidth, cardHeight);
    context.restore();

    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 2;
    this.drawRoundedRectPath(context, cardX, cardY, cardWidth, cardHeight, cornerRadius);
    context.stroke();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
          return;
        }

        reject(new Error('Falha ao converter imagem para formato WhatsApp.'));
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

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Falha ao converter blob para data URL.'));
      reader.readAsDataURL(blob);
    });
  }

  private drawRoundedRectPath(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  private interpolateTemplateText(text: string): string {
    if (!text || !text.includes('{')) {
      return text;
    }

    const tokens = this.getTemplateTokens();

    return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_fullMatch, token) => tokens[token] ?? '');
  }

  private getTemplateTokens(): Record<string, string> {
    const nomeValue = this.values['nome'] ?? this.template?.defaults['nome'] ?? 'Fulana';
    const nome = nomeValue.trim() || 'Fulana';
    const generoValue = (this.values['genero'] ?? this.template?.defaults['genero'] ?? 'feminino').toLowerCase();
    const isMasculino = generoValue === 'masculino';

    return {
      nome,
      genero: isMasculino ? 'Masculino' : 'Feminino',
      colaborador: isMasculino ? 'colaborador' : 'colaboradora',
      nossa: isMasculino ? 'nosso' : 'nossa',
      ao: isMasculino ? 'ao' : 'a'
    };
  }
}
