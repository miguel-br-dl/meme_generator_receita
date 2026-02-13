import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { MemeTemplate } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(private readonly http: HttpClient) {}

  getTemplates(): Observable<MemeTemplate[]> {
    return this.http.get<MemeTemplate[]>('/templates/index.json').pipe(
      catchError((error) => {
        console.error('Falha ao carregar templates', error);
        return of([]);
      })
    );
  }
}
