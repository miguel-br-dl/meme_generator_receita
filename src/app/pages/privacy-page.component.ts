import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { AdsenseBlockComponent } from '../components/adsense-block.component';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [CardModule, AdsenseBlockComponent],
  template: `
    <p-card header="Política de Privacidade">
      <p>
        Esta aplicação pode exibir anúncios via Google AdSense. O Google pode usar cookies para personalizar anúncios
        com base em visitas anteriores a este e a outros sites.
      </p>
      <p>
        Você pode desativar a personalização de anúncios nas configurações de anúncios do Google.
        Para mais detalhes, consulte as políticas de publicidade do Google.
      </p>
      <p>
        Não armazenamos dados pessoais sensíveis no servidor para geração de memes. Os dados preenchidos no formulário
        são usados apenas para renderização local da pré-visualização.
      </p>

      <app-adsense-block adSlot="2222222222"></app-adsense-block>
    </p-card>
  `
})
export class PrivacyPageComponent {}
