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
  downloadingWhatsapp = false;
  downloadError = '';
  templateMetaCollapsed = false;
  imageFieldNames: Record<string, string> = {};

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

  toggleTemplateMeta(): void {
    this.templateMetaCollapsed = !this.templateMetaCollapsed;
  }

  onImageSelected(fieldKey: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      this.form.get(fieldKey)?.setValue('', { emitEvent: false });
      this.imageFieldNames[fieldKey] = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.form.get(fieldKey)?.setValue('', { emitEvent: false });
      this.imageFieldNames[fieldKey] = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.get(fieldKey)?.setValue(String(reader.result ?? ''), { emitEvent: false });
      this.imageFieldNames[fieldKey] = file.name;
    };
    reader.onerror = () => {
      this.form.get(fieldKey)?.setValue('', { emitEvent: false });
      this.imageFieldNames[fieldKey] = '';
    };
    reader.readAsDataURL(file);
  }

  async downloadPreviewImage(): Promise<void> {
    if (!this.selectedTemplate || !this.previewComponent || this.downloading || this.downloadingWhatsapp) {
      return;
    }

    this.downloadError = '';
    this.downloading = true;

    try {
      const blob = await this.previewComponent.renderPngBlob();
      this.downloadBlob(blob, `${this.fileNameFromTemplate(this.selectedTemplate.name)}.png`);
    } catch (error) {
      console.error(error);
      this.downloadError = 'Nao foi possivel baixar a imagem agora. Tente novamente.';
    } finally {
      this.downloading = false;
    }
  }

  async downloadPreviewImageForWhatsapp(): Promise<void> {
    if (!this.selectedTemplate || !this.previewComponent || this.downloading || this.downloadingWhatsapp) {
      return;
    }

    this.downloadError = '';
    this.downloadingWhatsapp = true;

    try {
      const blob = await this.previewComponent.renderWhatsAppPngBlob();
      this.downloadBlob(blob, `${this.fileNameFromTemplate(this.selectedTemplate.name)}-whatsapp.png`);
    } catch (error) {
      console.error(error);
      this.downloadError = 'Nao foi possivel gerar a versao para WhatsApp agora. Tente novamente.';
    } finally {
      this.downloadingWhatsapp = false;
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

      const defaultValue = template.defaults[field.key] ?? field.options?.[0]?.value ?? '';
      this.form.get(field.key)?.setValue(defaultValue, { emitEvent: false });
    }

    this.imageFieldNames = {};
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

  private downloadBlob(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}
