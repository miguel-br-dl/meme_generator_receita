import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemeTemplate } from '../models/template.model';

@Component({
  selector: 'app-meme-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-shell" *ngIf="template as tpl; else emptyState">
      <article class="iphone" [style.background-image]="'url(' + tpl.assets.background + ')'">
        <div class="status-bar">
          <div>📶</div>
          <div class="battery">
            <span>{{ tpl.preview.battery }}</span>
            <div class="battery-icon">
              <div class="battery-level"></div>
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

      .iphone::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        z-index: 0;
      }

      .iphone > * {
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

      .battery-icon::after {
        content: '';
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

  resolve(key: string): string {
    return this.values[key] ?? this.template?.defaults[key] ?? '';
  }
}
