import { Directive, Input } from '@angular/core';

import { ResumeData, ResumePageData } from '../../models/resume.models';

@Directive()
export abstract class BaseTemplateComponent {
  @Input({ required: true }) data!: ResumeData;
  @Input({ required: true }) page!: ResumePageData;
  @Input() pageIndex = 0;
  @Input() mode: 'preview' | 'export' = 'preview';

  showHeader(): boolean {
    return this.pageIndex === 0;
  }

  hasSummary(): boolean {
    return Boolean(this.page.summary?.trim());
  }

  hasExperience(): boolean {
    return this.page.experience.length > 0;
  }

  hasEducation(): boolean {
    return this.page.education.length > 0;
  }

  hasSkills(): boolean {
    return this.page.skills.length > 0;
  }

  hasLanguages(): boolean {
    return this.page.languages.length > 0;
  }

  hasCustomSections(): boolean {
    return this.page.customSections.length > 0;
  }

  hasLinks(): boolean {
    return this.page.links.length > 0;
  }

  contactItems(): string[] {
    const basics = this.data.basics;
    return [basics.email, basics.phone, basics.location, basics.website].filter((item) => item.trim().length > 0);
  }

  formatLink(label: string, url: string): string {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();
    return trimmedLabel || trimmedUrl;
  }

  normalizeLink(url: string): string {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return '';
    }

    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  }

  linkItems(): Array<{ label: string; href: string }> {
    return this.page.links
      .map((item) => {
        const href = this.normalizeLink(item.url);
        const label = this.formatLink(item.label, item.url);
        return { label, href };
      })
      .filter((item) => item.label.length > 0 && item.href.length > 0);
  }

  skillsText(): string {
    return this.page.skills
      .map((item) => item.name.trim())
      .filter((item) => item.length > 0)
      .join(', ');
  }

  languagesText(): string {
    return this.page.languages
      .map((item) => [item.name.trim(), item.proficiency.trim()].filter((value) => value.length > 0).join(' - '))
      .filter((item) => item.length > 0)
      .join(', ');
  }
}
