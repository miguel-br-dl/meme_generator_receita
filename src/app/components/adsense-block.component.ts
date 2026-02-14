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
  templateUrl: './adsense-block.component.html',
  styleUrls: ['./adsense-block.component.css']
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
