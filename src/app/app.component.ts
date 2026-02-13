import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToolbarModule],
  template: `
    <p-toolbar styleClass="top-toolbar">
      <ng-template pTemplate="start">
        <a routerLink="/" class="brand">Meme Generator</a>
      </ng-template>
      <ng-template pTemplate="end">
        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Gerador</a>
          <a routerLink="/sobre" routerLinkActive="active">Sobre</a>
          <a routerLink="/politica-de-privacidade" routerLinkActive="active">Privacidade</a>
        </nav>
      </ng-template>
    </p-toolbar>

    <main class="page-shell">
      <router-outlet></router-outlet>
    </main>

    <footer class="footer">
      <small>© 2026 Meme Generator Receita</small>
    </footer>
  `,
  styles: [
    `
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .top-toolbar {
        border-radius: 0;
        border: none;
        background: #fff;
        box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
      }

      .brand {
        text-decoration: none;
        font-size: 1.1rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .nav-links {
        display: flex;
        gap: 1rem;
      }

      .nav-links a {
        text-decoration: none;
        font-weight: 600;
        color: #334155;
      }

      .nav-links a.active {
        color: #0b5fff;
      }

      .page-shell {
        width: min(1160px, 100% - 2rem);
        margin: 1.25rem auto;
        flex: 1;
      }

      .footer {
        text-align: center;
        padding: 1rem;
        color: #64748b;
      }

      @media (max-width: 768px) {
        .nav-links {
          gap: 0.75rem;
          font-size: 0.9rem;
        }
      }
    `
  ]
})
export class AppComponent {}
