import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms';
import { distinctUntilChanged, Subject, take, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TemplateService } from '../core/template.service';
import { MemeTemplate, TemplateField } from '../models/template.model';
import { MemePreviewComponent } from '../components/meme-preview.component';

@Component({
  selector: 'app-generator-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    MemePreviewComponent
  ],
  template: `
    <section class="generator-grid">
      <p-card header="Configuração do Meme">
        <p class="panel-text">Selecione um template e personalize os campos obrigatórios.</p>

        <p *ngIf="loading" class="feedback">Carregando templates...</p>
        <p *ngIf="loadError" class="feedback error">{{ loadError }}</p>

        <form [formGroup]="form" class="editor-form" *ngIf="!loading && !loadError">
          <label for="templateId">Template</label>
          <p-dropdown
            inputId="templateId"
            formControlName="templateId"
            [options]="templates"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione um template"
            [showClear]="false"
            styleClass="w-full"
          ></p-dropdown>

          <section class="template-meta" *ngIf="selectedTemplate as tpl">
            <p class="template-description">{{ tpl.description }}</p>
            <img
              *ngIf="tpl.assets.preview"
              class="template-thumb"
              [src]="tpl.assets.preview"
              [alt]="'Preview de ' + tpl.name"
            />
          </section>

          <ng-container *ngFor="let field of fields; trackBy: trackByKey">
            <label [for]="field.key">{{ field.label }}</label>

            <input
              *ngIf="field.type === 'text'"
              pInputText
              [id]="field.key"
              [placeholder]="field.placeholder || ''"
              [formControlName]="field.key"
              [attr.maxlength]="field.maxLength || null"
            />

            <textarea
              *ngIf="field.type === 'textarea'"
              pInputTextarea
              [id]="field.key"
              [placeholder]="field.placeholder || ''"
              [formControlName]="field.key"
              [attr.maxlength]="field.maxLength || null"
              [autoResize]="true"
              rows="3"
            ></textarea>
          </ng-container>
        </form>
      </p-card>

      <p-card header="Pré-visualização">
        <app-meme-preview [template]="selectedTemplate" [values]="previewValues"></app-meme-preview>

        <div class="preview-actions">
          <button type="button" class="download-button" (click)="downloadPreviewImage()" [disabled]="!selectedTemplate || downloading">
            {{ downloading ? 'Gerando imagem...' : 'Baixar imagem' }}
          </button>
          <p *ngIf="downloadError" class="feedback error">{{ downloadError }}</p>
        </div>
      </p-card>
    </section>
  `,
  styles: [
    `
      .generator-grid {
        display: grid;
        grid-template-columns: 340px 1fr;
        gap: 1rem;
        align-items: start;
      }

      .panel-text {
        margin-top: 0;
        color: #475569;
      }

      .editor-form {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
      }

      .template-meta {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.75rem;
      }

      .template-description {
        margin: 0;
        color: #334155;
      }

      .template-thumb {
        margin-top: 0.6rem;
        width: 100%;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
      }

      label {
        font-weight: 600;
        color: #334155;
      }

      .feedback {
        margin: 0.5rem 0;
        color: #334155;
      }

      .feedback.error {
        color: #b91c1c;
      }

      .preview-actions {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .download-button {
        border: 0;
        border-radius: 999px;
        background: linear-gradient(90deg, #0ea5e9, #0284c7);
        color: #fff;
        font-weight: 700;
        padding: 0.65rem 1rem;
        cursor: pointer;
      }

      .download-button:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      @media (max-width: 980px) {
        .generator-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class GeneratorPageComponent implements OnInit, OnDestroy {
  @ViewChild(MemePreviewComponent) private previewComponent?: MemePreviewComponent;

  readonly form = this.formBuilder.group({
    templateId: ['']
  });

  templates: MemeTemplate[] = [];
  selectedTemplate: MemeTemplate | null = null;
  loading = true;
  loadError = '';
  downloading = false;
  downloadError = '';

  private dynamicKeys = new Set<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly formBuilder: UntypedFormBuilder,
    private readonly templateService: TemplateService
  ) {}

  ngOnInit(): void {
    this.templateService
      .getTemplates()
      .pipe(take(1))
      .subscribe((templates) => {
        this.templates = templates;
        this.loading = false;

        if (!templates.length) {
          this.loadError = 'Nenhum template encontrado em templates/index.json.';
          return;
        }

        const firstId = templates[0].id;
        this.form.patchValue({ templateId: firstId }, { emitEvent: false });
        this.applyTemplate(firstId);
      });

    this.form
      .get('templateId')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((templateId) => {
        this.applyTemplate(templateId);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fields(): TemplateField[] {
    return this.selectedTemplate?.fields ?? [];
  }

  get previewValues(): Record<string, string> {
    const values: Record<string, string> = {};

    if (!this.selectedTemplate) {
      return values;
    }

    for (const field of this.selectedTemplate.fields) {
      const current = this.form.get(field.key)?.value;
      values[field.key] = typeof current === 'string' ? current : this.selectedTemplate.defaults[field.key] ?? '';
    }

    return values;
  }

  trackByKey(_index: number, field: TemplateField): string {
    return field.key;
  }

  async downloadPreviewImage(): Promise<void> {
    if (!this.selectedTemplate || !this.previewComponent || this.downloading) {
      return;
    }

    this.downloadError = '';
    this.downloading = true;

    try {
      const blob = await this.previewComponent.renderPngBlob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${this.fileNameFromTemplate(this.selectedTemplate.name)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      console.error(error);
      this.downloadError = 'Nao foi possivel baixar a imagem agora. Tente novamente.';
    } finally {
      this.downloading = false;
    }
  }

  private applyTemplate(templateId: string | null): void {
    if (!templateId) {
      return;
    }

    const template = this.templates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    this.selectedTemplate = template;
    this.syncFieldControls(template);
  }

  private syncFieldControls(template: MemeTemplate): void {
    const nextKeys = new Set(template.fields.map((field) => field.key));

    for (const key of Array.from(this.dynamicKeys)) {
      if (!nextKeys.has(key)) {
        this.form.removeControl(key);
      }
    }

    for (const field of template.fields) {
      if (!this.form.contains(field.key)) {
        this.form.addControl(field.key, this.formBuilder.control(''));
      }

      const defaultValue = template.defaults[field.key] ?? '';
      this.form.get(field.key)?.setValue(defaultValue, { emitEvent: false });
    }

    this.dynamicKeys = nextKeys;
  }

  private fileNameFromTemplate(name: string): string {
    const normalized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'meme';
  }
}
