export type ResumeTemplateId =
  | 'atlas'
  | 'aurora'
  | 'breeze'
  | 'cedar'
  | 'ember'
  | 'graphite'
  | 'iris'
  | 'mono'
  | 'signal'
  | 'zen';

export interface ResumeBasics {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
}

export interface ResumeExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface ResumeEducationItem {
  id: string;
  institution: string;
  degree: string;
  period: string;
  description: string;
}

export interface ResumeSkillItem {
  id: string;
  name: string;
}

export interface ResumeLanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

export interface ResumeCustomSectionItem {
  id: string;
  title: string;
  content: string;
}

export interface ResumeLinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ResumeData {
  basics: ResumeBasics;
  summary: string;
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  skills: ResumeSkillItem[];
  languages: ResumeLanguageItem[];
  customSections: ResumeCustomSectionItem[];
  links: ResumeLinkItem[];
}

export interface ResumePageData {
  summary?: string;
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  skills: ResumeSkillItem[];
  languages: ResumeLanguageItem[];
  customSections: ResumeCustomSectionItem[];
  links: ResumeLinkItem[];
}

export interface TemplateCard {
  id: ResumeTemplateId;
  name: string;
  description: string;
  previewClass: string;
}

export const TEMPLATE_IDS: ResumeTemplateId[] = [
  'atlas',
  'aurora',
  'breeze',
  'cedar',
  'ember',
  'graphite',
  'iris',
  'mono',
  'signal',
  'zen'
];

export function createEmptyResumeData(): ResumeData {
  return {
    basics: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: ''
    },
    summary: '',
    experience: [createExperienceItem()],
    education: [createEducationItem()],
    skills: [createSkillItem()],
    languages: [createLanguageItem()],
    customSections: [createCustomSectionItem()],
    links: [createLinkItem()]
  };
}

export function createExperienceItem(): ResumeExperienceItem {
  return {
    id: crypto.randomUUID(),
    company: '',
    role: '',
    period: '',
    description: ''
  };
}

export function createEducationItem(): ResumeEducationItem {
  return {
    id: crypto.randomUUID(),
    institution: '',
    degree: '',
    period: '',
    description: ''
  };
}

export function createSkillItem(): ResumeSkillItem {
  return {
    id: crypto.randomUUID(),
    name: ''
  };
}

export function createLanguageItem(): ResumeLanguageItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    proficiency: ''
  };
}

export function createCustomSectionItem(): ResumeCustomSectionItem {
  return {
    id: crypto.randomUUID(),
    title: '',
    content: ''
  };
}

export function createLinkItem(): ResumeLinkItem {
  return {
    id: crypto.randomUUID(),
    label: '',
    url: ''
  };
}
