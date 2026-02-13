import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { AdsenseBlockComponent } from '../components/adsense-block.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CardModule, AdsenseBlockComponent],
  template: `
    <p-card header="Sobre o Projeto">
      <p>
        Este site foi criado para gerar memes no formato de notificação usando templates reutilizáveis.
        Você escolhe o template, edita os campos e acompanha a pré-visualização em tempo real.
      </p>
      <p>
        Novos templates podem ser adicionados na pasta <code>templates/</code>, sem alterar a estrutura principal do app.
      </p>

      <app-adsense-block adSlot="1111111111"></app-adsense-block>
    </p-card>
  `
})
export class AboutPageComponent {}
