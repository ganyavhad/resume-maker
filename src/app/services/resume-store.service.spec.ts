import { ResumeStoreService } from './resume-store.service';

describe('ResumeStoreService', () => {
  let service: ResumeStoreService;

  beforeEach(() => {
    localStorage.clear();
    service = new ResumeStoreService();
  });

  it('persists the selected template', () => {
    service.setTemplate('atlas');
    expect(service.getTemplate()).toBe('atlas');
  });

  it('stores and reloads draft data', () => {
    const current = service.getSnapshot();
    current.basics.name = 'Jane Doe';
    current.basics.title = 'Engineer';
    current.summary = 'Summary';

    service.saveDraft(current);

    const loaded = service.loadDraft();
    expect(loaded.basics.name).toBe('Jane Doe');
    expect(loaded.summary).toBe('Summary');
  });
});

