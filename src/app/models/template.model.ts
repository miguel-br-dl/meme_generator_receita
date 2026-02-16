export type TemplateFieldType = 'text' | 'textarea' | 'select' | 'image';

export interface TemplateFieldOption {
  label: string;
  value: string;
}

export interface TemplateField {
  key: string;
  label: string;
  placeholder?: string;
  type: TemplateFieldType;
  maxLength?: number;
  options?: TemplateFieldOption[];
}

export interface NotificationSlot {
  titleKey: string;
  textKey: string;
  timeLabel?: string;
}

export interface TemplatePreviewConfig {
  time: string;
  subtitle: string;
  battery: string;
  notificationTime: string;
}

export interface MemeTemplate {
  id: string;
  name: string;
  description: string;
  layout?: 'iphone' | 'descanse';
  assets: {
    background: string;
    appIcon: string;
    preview?: string;
  };
  fields: TemplateField[];
  defaults: Record<string, string>;
  notifications: NotificationSlot[];
  preview: TemplatePreviewConfig;
}
