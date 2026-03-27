import {
  ResumeCustomSectionItem,
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLanguageItem,
  ResumeLinkItem,
  ResumePageData,
  ResumeSkillItem
} from '../models/resume.models';

const DEFAULT_PAGE_CAPACITY = 100;
const TARGET_PAGE_COUNT = 2;
const MAX_COMPRESSED_PAGE_CAPACITY = 135;

interface WeightedChunk<T> {
  items: T[];
  weight: number;
}

interface PageBlock {
  weight: number;
  apply: (page: ResumePageData) => void;
}

export function paginateResumeData(data: ResumeData): ResumePageData[] {
  const blocks = createBlocks(data);
  const totalWeight = blocks.reduce((sum, block) => sum + block.weight, 0);
  const effectivePageCapacity = resolvePageCapacity(totalWeight);

  const pages: ResumePageData[] = [];
  let currentPage = createEmptyPage();
  let currentWeight = 0;

  for (const block of blocks) {
    ({ currentPage, currentWeight } = placeBlock(
      pages,
      currentPage,
      currentWeight,
      effectivePageCapacity,
      block.weight,
      block.apply
    ));
  }

  if (!hasVisiblePageContent(currentPage) || pages.length === 0) {
    pages.push(currentPage);
  } else if (hasVisiblePageContent(currentPage)) {
    pages.push(currentPage);
  }

  return pages;
}

export function hasRenderableContent(data: ResumeData): boolean {
  return Boolean(
    data.summary.trim() ||
    filterExperience(data.experience).length ||
    filterEducation(data.education).length ||
    filterCustomSections(data.customSections).length ||
    filterSkills(data.skills).length ||
    filterLanguages(data.languages).length ||
    filterLinks(data.links).length
  );
}

export function isResumeValid(data: ResumeData): boolean {
  const basicsValid = Boolean(data.basics.name.trim() && data.basics.title.trim());
  return basicsValid && hasRenderableContent(data);
}

function createBlocks(data: ResumeData): PageBlock[] {
  const blocks: PageBlock[] = [];

  const summaryWeight = estimateTextWeight(data.summary, 14, 20);
  if (data.summary.trim()) {
    blocks.push({
      weight: summaryWeight,
      apply: (page) => {
        page.summary = data.summary.trim();
      }
    });
  }

  for (const item of filterExperience(data.experience)) {
    blocks.push({
      weight: estimateTextWeight([item.role, item.company, item.period, item.description].join(' '), 14, 24),
      apply: (page) => page.experience.push(item)
    });
  }

  for (const item of filterEducation(data.education)) {
    blocks.push({
      weight: estimateTextWeight([item.degree, item.institution, item.period, item.description].join(' '), 11, 18),
      apply: (page) => page.education.push(item)
    });
  }

  for (const chunk of chunkSkills(filterSkills(data.skills))) {
    blocks.push({
      weight: chunk.weight,
      apply: (page) => page.skills.push(...chunk.items)
    });
  }

  for (const chunk of chunkLanguages(filterLanguages(data.languages))) {
    blocks.push({
      weight: chunk.weight,
      apply: (page) => page.languages.push(...chunk.items)
    });
  }

  for (const chunk of chunkLinks(filterLinks(data.links))) {
    blocks.push({
      weight: chunk.weight,
      apply: (page) => page.links.push(...chunk.items)
    });
  }
  for (const item of filterCustomSections(data.customSections)) {
    blocks.push({
      weight: estimateTextWeight([item.title, item.content].join(' '), 8, 14),
      apply: (page) => page.customSections.push(item)
    });
  }

  return blocks;
}

function resolvePageCapacity(totalWeight: number): number {
  if (totalWeight <= DEFAULT_PAGE_CAPACITY * TARGET_PAGE_COUNT) {
    return DEFAULT_PAGE_CAPACITY;
  }

  return Math.min(MAX_COMPRESSED_PAGE_CAPACITY, Math.ceil(totalWeight / TARGET_PAGE_COUNT));
}

function createEmptyPage(): ResumePageData {
  return {
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    customSections: [],
    links: []
  };
}

function hasVisiblePageContent(page: ResumePageData): boolean {
  return Boolean(
    page.summary?.trim() ||
    page.experience.length ||
    page.education.length ||
    page.customSections.length ||
    page.skills.length ||
    page.languages.length ||
    page.links.length
  );
}

function placeBlock(
  pages: ResumePageData[],
  page: ResumePageData,
  currentWeight: number,
  pageCapacity: number,
  blockWeight: number,
  apply: (page: ResumePageData) => void
): { currentPage: ResumePageData; currentWeight: number } {
  let nextPage = page;
  let nextWeight = currentWeight;

  if (nextWeight + blockWeight > pageCapacity && hasVisiblePageContent(nextPage)) {
    pages.push(nextPage);
    nextPage = createEmptyPage();
    nextWeight = 0;
  }

  apply(nextPage);
  nextWeight += blockWeight;

  return {
    currentPage: nextPage,
    currentWeight: nextWeight
  };
}

function estimateTextWeight(value: string, base: number, max: number): number {
  const normalized = value.trim();
  if (!normalized) {
    return 0;
  }

  return Math.min(base + Math.ceil(normalized.length / 160) * 3, max);
}

function filterExperience(items: ResumeExperienceItem[]): ResumeExperienceItem[] {
  return items.filter((item) => hasAnyText(item.company, item.role, item.period, item.description));
}

function filterEducation(items: ResumeEducationItem[]): ResumeEducationItem[] {
  return items.filter((item) => hasAnyText(item.institution, item.degree, item.period, item.description));
}

function filterCustomSections(items: ResumeCustomSectionItem[]): ResumeCustomSectionItem[] {
  return items.filter((item) => hasAnyText(item.title, item.content));
}

function filterSkills(items: ResumeSkillItem[]): ResumeSkillItem[] {
  return items.filter((item) => item.name.trim().length > 0);
}

function filterLanguages(items: ResumeLanguageItem[]): ResumeLanguageItem[] {
  return items.filter((item) => hasAnyText(item.name, item.proficiency));
}

function filterLinks(items: ResumeLinkItem[]): ResumeLinkItem[] {
  return items.filter((item) => hasAnyText(item.label, item.url));
}

function chunkSkills(items: ResumeSkillItem[]): WeightedChunk<ResumeSkillItem>[] {
  return chunkSimpleItems(items, 20, 4, 10, 1);
}

function chunkLanguages(items: ResumeLanguageItem[]): WeightedChunk<ResumeLanguageItem>[] {
  return chunkSimpleItems(items, 16, 3, 8, 1);
}

function chunkLinks(items: ResumeLinkItem[]): WeightedChunk<ResumeLinkItem>[] {
  return chunkSimpleItems(items, 10, 4, 5, 1);
}

function chunkSimpleItems<T>(items: T[], chunkSize: number, base: number, divisor: number, increment: number): WeightedChunk<T>[] {
  if (!items.length) {
    return [];
  }

  const chunks: WeightedChunk<T>[] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    const currentItems = items.slice(index, index + chunkSize);
    chunks.push({
      items: currentItems,
      weight: base + Math.ceil(currentItems.length / divisor) * increment
    });
  }

  return chunks;
}

function hasAnyText(...values: string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

