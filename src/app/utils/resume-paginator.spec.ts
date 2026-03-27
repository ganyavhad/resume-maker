import { paginateResumeData } from './resume-paginator';
import { ResumeData } from '../models/resume.models';

function createData(): ResumeData {
  return {
    basics: {
      name: 'Jane Smith',
      title: 'Product Designer',
      email: 'jane@example.com',
      phone: '',
      location: '',
      website: ''
    },
    summary: 'Experienced designer focused on SaaS workflows.',
    experience: [
      {
        id: 'exp-1',
        company: 'Acme',
        role: 'Lead Designer',
        period: '2022 - Present',
        description: 'Owned the design system and product discovery.'
      }
    ],
    education: [],
    skills: [
      { id: 'skill-1', name: 'Figma' },
      { id: 'skill-2', name: 'UX Research' }
    ],
    languages: [],
    customSections: [],
    links: []
  };
}

describe('paginateResumeData', () => {
  it('returns at least one page', () => {
    const pages = paginateResumeData(createData());
    expect(pages.length).toBe(1);
  });

  it('spreads long content across multiple pages', () => {
    const data = createData();
    data.experience = Array.from({ length: 8 }, (_, index) => ({
      id: `exp-${index}`,
      company: `Company ${index}`,
      role: `Role ${index}`,
      period: '2020 - Present',
      description: 'Delivered measurable outcomes through process improvements, hiring, mentoring, and roadmap execution. '.repeat(8)
    }));

    const pages = paginateResumeData(data);
    expect(pages.length).toBeGreaterThan(1);
  });
});
