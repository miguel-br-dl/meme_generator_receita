import { Routes } from '@angular/router';
import { GeneratorPageComponent } from './pages/generator-page.component';
import { AboutPageComponent } from './pages/about-page.component';
import { PrivacyPageComponent } from './pages/privacy-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: GeneratorPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'sobre',
    component: AboutPageComponent
  },
  {
    path: 'politica-de-privacidade',
    component: PrivacyPageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
