import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { MemeTemplate } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(private readonly http: HttpClient) {}

  getTemplates(): Observable<MemeTemplate[]> {
    return this.http.get<MemeTemplate[]>('templates/index.json').pipe(
      map((templates) => templates.map((template) => this.normalizeTemplatePaths(template))),
      catchError((error) => {
        console.error('Falha ao carregar templates', error);
        return of([]);
      })
    );
  }

  private normalizeTemplatePaths(template: MemeTemplate): MemeTemplate {
    return {
      ...template,
      assets: {
        ...template.assets,
        background: this.normalizePath(template.assets.background),
        appIcon: this.normalizePath(template.assets.appIcon),
        preview: template.assets.preview ? this.normalizePath(template.assets.preview) : undefined
      }
    };
  }

  private normalizePath(value: string): string {
    if (value.startsWith('/templates/')) {
      return value.slice(1);
    }

    return value;
  }
}
