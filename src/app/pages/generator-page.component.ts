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
  templateUrl: './generator-page.component.html',
  styleUrls: ['./generator-page.component.css']
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
