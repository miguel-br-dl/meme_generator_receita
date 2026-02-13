import { AfterViewInit, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

@Component({
  selector: 'app-adsense-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ads-wrapper">
      <ins
        class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-2236242824534513"
        [attr.data-ad-slot]="adSlot"
        [attr.data-ad-format]="adFormat"
        [attr.data-full-width-responsive]="fullWidthResponsive ? 'true' : 'false'"
      ></ins>
      <small class="ads-note">
        Client AdSense configurado. Agora falta apenas definir os <code>adSlot</code> reais.
      </small>
    </section>
  `,
  styles: [
    `
      .ads-wrapper {
        margin-top: 1.5rem;
        border: 1px dashed #cbd5e1;
        border-radius: 10px;
        background: #fff;
        padding: 1rem;
      }

      .ads-note {
        display: block;
        margin-top: 0.8rem;
        color: #64748b;
      }
    `
  ]
})
export class AdsenseBlockComponent implements AfterViewInit {
  @Input() adSlot = '0000000000';
  @Input() adFormat = 'auto';
  @Input() fullWidthResponsive = true;

  ngAfterViewInit(): void {
    if (!window.adsbygoogle) {
      return;
    }

    try {
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn('AdSense não inicializado', error);
    }
  }
}
