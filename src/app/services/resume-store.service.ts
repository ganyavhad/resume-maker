import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  ResumeCustomSectionItem,
  ResumeData,
  ResumeTemplateId,
  TEMPLATE_IDS,
  createEmptyResumeData
} from '../models/resume.models';

const DRAFT_KEY = 'resume-maker:draft';
const TEMPLATE_KEY = 'resume-maker:template';

@Injectable({ providedIn: 'root' })
export class ResumeStoreService {
  private readonly dataSubject = new BehaviorSubject<ResumeData>(this.loadDraft());
  private readonly templateSubject = new BehaviorSubject<ResumeTemplateId>(this.loadTemplate());

  readonly data$ = this.dataSubject.asObservable();
  readonly template$ = this.templateSubject.asObservable();

  loadDraft(): ResumeData {
    const fallback = createEmptyResumeData();
    const raw = this.safeGet(DRAFT_KEY);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as ResumeData & {
        certificates?: Array<{ name?: string; issuer?: string; year?: string }>;
        achievements?: Array<{ title?: string; description?: string }>;
      };
      return {
        ...fallback,
        ...parsed,
        basics: {
          ...fallback.basics,
          ...parsed.basics
        },
        experience: Array.isArray(parsed.experience) && parsed.experience.length ? parsed.experience : fallback.experience,
        education: Array.isArray(parsed.education) && parsed.education.length ? parsed.education : fallback.education,
        skills: Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills : fallback.skills,
        languages: Array.isArray(parsed.languages) && parsed.languages.length ? parsed.languages : fallback.languages,
        customSections: Array.isArray(parsed.customSections) && parsed.customSections.length
          ? parsed.customSections
          : this.migrateLegacySections(parsed, fallback.customSections),
        links: Array.isArray(parsed.links) && parsed.links.length ? parsed.links : fallback.links
      };
    } catch {
      return fallback;
    }
  }

  saveDraft(data: ResumeData): void {
    this.dataSubject.next(data);
    this.safeSet(DRAFT_KEY, JSON.stringify(data));
  }

  clearDraft(): void {
    const empty = createEmptyResumeData();
    this.dataSubject.next(empty);
    this.safeSet(DRAFT_KEY, JSON.stringify(empty));
  }

  getSnapshot(): ResumeData {
    return this.dataSubject.value;
  }

  setTemplate(templateId: ResumeTemplateId): void {
    this.templateSubject.next(templateId);
    this.safeSet(TEMPLATE_KEY, templateId);
  }

  getTemplate(): ResumeTemplateId {
    return this.templateSubject.value;
  }

  private loadTemplate(): ResumeTemplateId {
    const raw = this.safeGet(TEMPLATE_KEY);
    return TEMPLATE_IDS.includes(raw as ResumeTemplateId) ? (raw as ResumeTemplateId) : 'atlas';
  }

  private migrateLegacySections(
    parsed: {
      certificates?: Array<{ name?: string; issuer?: string; year?: string }>;
      achievements?: Array<{ title?: string; description?: string }>;
    },
    fallback: ResumeCustomSectionItem[]
  ): ResumeCustomSectionItem[] {
    const migrated: ResumeCustomSectionItem[] = [];

    for (const item of parsed.certificates ?? []) {
      const title = (item.name ?? '').trim();
      const content = [(item.issuer ?? '').trim(), (item.year ?? '').trim()].filter((value) => value.length > 0).join(' - ');
      if (title || content) {
        migrated.push({ id: crypto.randomUUID(), title: title || 'Custom Section', content });
      }
    }

    for (const item of parsed.achievements ?? []) {
      const title = (item.title ?? '').trim();
      const content = (item.description ?? '').trim();
      if (title || content) {
        migrated.push({ id: crypto.randomUUID(), title: title || 'Custom Section', content });
      }
    }

    return migrated.length ? migrated : fallback;
  }

  private safeGet(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  }

  private safeSet(key: string, value: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(key, value);
  }
}
