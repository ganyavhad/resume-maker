import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import type { RawEditorOptions } from 'tinymce';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

import { TEMPLATE_CARDS } from '../data/template-metadata';
import {
  ResumeCustomSectionItem,
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLanguageItem,
  ResumeLinkItem,
  ResumeSkillItem,
  ResumeTemplateId,
  createCustomSectionItem,
  createEducationItem,
  createEmptyResumeData,
  createExperienceItem,
  createLanguageItem,
  createLinkItem,
  createSkillItem
} from '../models/resume.models';
import { ResumeStoreService } from '../services/resume-store.service';
import { hasRenderableContent, isResumeValid } from '../utils/resume-paginator';
import { ResumePreviewComponent } from './resume-preview.component';

type SectionId = 'basics' | 'experience' | 'education' | 'custom' | 'skills' | 'languages' | 'links';

type BasicsForm = FormGroup<{
  name: FormControl<string>;
  title: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  location: FormControl<string>;
  website: FormControl<string>;
}>;

type ExperienceForm = FormGroup<{
  id: FormControl<string>;
  company: FormControl<string>;
  role: FormControl<string>;
  period: FormControl<string>;
  description: FormControl<string>;
}>;

type EducationForm = FormGroup<{
  id: FormControl<string>;
  institution: FormControl<string>;
  degree: FormControl<string>;
  period: FormControl<string>;
  description: FormControl<string>;
}>;

type SkillForm = FormGroup<{
  id: FormControl<string>;
  name: FormControl<string>;
}>;

type LanguageForm = FormGroup<{
  id: FormControl<string>;
  name: FormControl<string>;
  proficiency: FormControl<string>;
}>;

type CustomSectionForm = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  content: FormControl<string>;
}>;

type LinkForm = FormGroup<{
  id: FormControl<string>;
  label: FormControl<string>;
  url: FormControl<string>;
}>;

@Component({
  selector: 'app-resume-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditorModule, ResumePreviewComponent],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: '/tinymce/tinymce.min.js' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="editor-shell">
      <header class="editor-header">
        <div>
          <button class="ghost-link" type="button" (click)="backToTemplates()">Back to templates</button>
          <p class="eyebrow">Resume Builder</p>
        </div>
        <div class="header-actions">
          <label class="template-switcher">
            <span>Template</span>
            <select [value]="selectedTemplate" (change)="onTemplateChange($any($event.target).value)">
              <option *ngFor="let card of templateCards" [value]="card.id">{{ card.name }}</option>
            </select>
          </label>
          <button class="secondary-button" type="button" (click)="resetDraft()">Reset draft</button>
          <button class="primary-button" type="button" [disabled]="!canExport || exporting" (click)="exportPdf()">
            {{ exporting ? 'Exporting...' : 'Export PDF' }}
          </button>
        </div>
      </header>

      <div class="validation-banner" *ngIf="showValidationHint">
        Add your name, your target role, and at least one filled section among summary, experience,
        education, custom sections, skills, languages, or links before export.
      </div>

      <div class="editor-layout">
        <form class="form-panel" [formGroup]="form">
          <div class="tabs">
            <button
              *ngFor="let section of sections"
              type="button"
              class="tab"
              [class.active]="activeSection === section.id"
              (click)="activeSection = section.id"
            >
              {{ section.label }}
            </button>
          </div>

          <div class="form-body" *ngIf="activeSection === 'basics'">
            <div formGroupName="basics">
              <div class="field-group">
                <label>Full Name</label>
                <input formControlName="name" placeholder="Jane Smith">
              </div>
              <div class="field-group">
                <label>Job Title / Role</label>
                <input formControlName="title" placeholder="Senior Product Designer">
              </div>
              <div class="field-grid">
                <div class="field-group">
                  <label>Email</label>
                  <input formControlName="email" placeholder="jane@example.com">
                </div>
                <div class="field-group">
                  <label>Phone</label>
                  <input formControlName="phone" placeholder="+1 555 000 0000">
                </div>
              </div>
              <div class="field-grid">
                <div class="field-group">
                  <label>Location</label>
                  <input formControlName="location" placeholder="New York, USA">
                </div>
                <div class="field-group">
                  <label>Website / LinkedIn</label>
                  <input formControlName="website" placeholder="linkedin.com/in/jane">
                </div>
              </div>
            </div>
            <div class="field-group">
              <label>Professional Summary</label>
              <textarea formControlName="summary" rows="6" placeholder="Write a concise summary of your experience, strengths, and goals."></textarea>
            </div>
          </div>

          <div class="form-body" *ngIf="activeSection === 'experience'">
            <div class="section-head">
              <div>
                <h2>Experience</h2>
                <p>List the roles you want to highlight on the resume.</p>
              </div>
              <button class="secondary-button" type="button" (click)="addExperience()">Add role</button>
            </div>
            <div formArrayName="experience">
              <div *ngFor="let group of experienceControls; let index = index" [formGroupName]="index" class="entry-card">
                <div class="entry-actions">
                  <button type="button" class="icon-button" (click)="moveExperience(index, -1)" [disabled]="index === 0">Up</button>
                  <button type="button" class="icon-button" (click)="moveExperience(index, 1)" [disabled]="index === experienceControls.length - 1">Down</button>
                  <button type="button" class="icon-button danger" (click)="removeExperience(index)" [disabled]="experienceControls.length === 1">Delete</button>
                </div>
                <div class="field-group"><label>Company</label><input formControlName="company" placeholder="Acme Corp"></div>
                <div class="field-group"><label>Role / Title</label><input formControlName="role" placeholder="Product Manager"></div>
                <div class="field-group"><label>Period</label><input formControlName="period" placeholder="Jan 2021 - Present"></div>
                <div class="field-group">
                  <label>Description</label>
                  <editor formControlName="description" [init]="experienceEditorConfig"></editor>
                </div>
              </div>
            </div>
          </div>

          <div class="form-body" *ngIf="activeSection === 'education'">
            <div class="section-head">
              <div>
                <h2>Education</h2>
                <p>Add formal education and academic highlights.</p>
              </div>
              <button class="secondary-button" type="button" (click)="addEducation()">Add education</button>
            </div>
            <div formArrayName="education">
              <div *ngFor="let group of educationControls; let index = index" [formGroupName]="index" class="entry-card">
                <div class="entry-actions">
                  <button type="button" class="icon-button" (click)="moveEducation(index, -1)" [disabled]="index === 0">Up</button>
                  <button type="button" class="icon-button" (click)="moveEducation(index, 1)" [disabled]="index === educationControls.length - 1">Down</button>
                  <button type="button" class="icon-button danger" (click)="removeEducation(index)" [disabled]="educationControls.length === 1">Delete</button>
                </div>
                <div class="field-group"><label>Institution</label><input formControlName="institution" placeholder="MIT"></div>
                <div class="field-group"><label>Degree / Field</label><input formControlName="degree" placeholder="B.Sc. Computer Science"></div>
                <div class="field-group"><label>Period</label><input formControlName="period" placeholder="2015 - 2019"></div>
                <div class="field-group"><label>Notes</label><textarea rows="3" formControlName="description" placeholder="GPA, honors, thesis, or relevant coursework."></textarea></div>
              </div>
            </div>
          </div>

          <div class="form-body" *ngIf="activeSection === 'skills'">
            <div class="section-head">
              <div>
                <h2>Skills</h2>
                <p>Keep the list concise and relevant to the target role.</p>
              </div>
              <button class="secondary-button" type="button" (click)="addSkill()">Add skill</button>
            </div>
            <div formArrayName="skills">
              <div *ngFor="let group of skillControls; let index = index" [formGroupName]="index" class="skill-row">
                <input formControlName="name" placeholder="Figma, Python, Stakeholder management">
                <button type="button" class="icon-button" (click)="moveSkill(index, -1)" [disabled]="index === 0">Up</button>
                <button type="button" class="icon-button" (click)="moveSkill(index, 1)" [disabled]="index === skillControls.length - 1">Down</button>
                <button type="button" class="icon-button danger" (click)="removeSkill(index)" [disabled]="skillControls.length === 1">Delete</button>
              </div>
            </div>
          </div>

          <div class="form-body" *ngIf="activeSection === 'languages'">
            <div class="section-head">
              <div>
                <h2>Languages</h2>
                <p>List spoken languages with your proficiency level.</p>
              </div>
              <button class="secondary-button" type="button" (click)="addLanguage()">Add language</button>
            </div>
            <div formArrayName="languages">
              <div *ngFor="let group of languageControls; let index = index" [formGroupName]="index" class="entry-card compact-card">
                <div class="entry-actions">
                  <button type="button" class="icon-button" (click)="moveLanguage(index, -1)" [disabled]="index === 0">Up</button>
                  <button type="button" class="icon-button" (click)="moveLanguage(index, 1)" [disabled]="index === languageControls.length - 1">Down</button>
                  <button type="button" class="icon-button danger" (click)="removeLanguage(index)" [disabled]="languageControls.length === 1">Delete</button>
                </div>
                <div class="field-grid">
                  <div class="field-group"><label>Language</label><input formControlName="name" placeholder="English"></div>
                  <div class="field-group"><label>Proficiency</label><input formControlName="proficiency" placeholder="Native, Fluent, B2"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-body" *ngIf="activeSection === 'links'">
            <div class="section-head">
              <div>
                <h2>Links</h2>
                <p>Add portfolio, GitHub, LinkedIn, or project URLs.</p>
              </div>
              <button class="secondary-button" type="button" (click)="addLink()">Add link</button>
            </div>
            <div formArrayName="links">
              <div *ngFor="let group of linkControls; let index = index" [formGroupName]="index" class="entry-card compact-card">
                <div class="entry-actions">
                  <button type="button" class="icon-button" (click)="moveLink(index, -1)" [disabled]="index === 0">Up</button>
                  <button type="button" class="icon-button" (click)="moveLink(index, 1)" [disabled]="index === linkControls.length - 1">Down</button>
                  <button type="button" class="icon-button danger" (click)="removeLink(index)" [disabled]="linkControls.length === 1">Delete</button>
                </div>
                <div class="field-group"><label>Label</label><input formControlName="label" placeholder="Portfolio"></div>
                <div class="field-group"><label>URL</label><input formControlName="url" placeholder="https://your-site.com"></div>
              </div>
            </div>
          </div>
          <div class="form-body" *ngIf="activeSection === 'custom'">
            <div class="section-head">
              <div>
                <h2>Custom Sections</h2>
                <p>Create your own section names like Projects, Awards, Certifications, Publications, or Volunteer Work.</p>
              </div>
              <button class="secondary-button" type="button" (click)="addCustomSection()">Add custom section</button>
            </div>
            <div formArrayName="customSections">
              <div *ngFor="let group of customSectionControls; let index = index" [formGroupName]="index" class="entry-card">
                <div class="entry-actions">
                  <button type="button" class="icon-button" (click)="moveCustomSection(index, -1)" [disabled]="index === 0">Up</button>
                  <button type="button" class="icon-button" (click)="moveCustomSection(index, 1)" [disabled]="index === customSectionControls.length - 1">Down</button>
                  <button type="button" class="icon-button danger" (click)="removeCustomSection(index)" [disabled]="customSectionControls.length === 1">Delete</button>
                </div>
                <div class="field-group"><label>Section Name</label><input formControlName="title" placeholder="Projects"></div>
                <div class="field-group"><label>Content</label><textarea rows="4" formControlName="content" placeholder="Add the content for this section."></textarea></div>
              </div>
            </div>
          </div>


        </form>

        <aside class="preview-panel">
          <app-resume-preview
            #preview
            [data]="previewData"
            [templateId]="selectedTemplate"
            mode="preview"
          />
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .editor-shell { padding: 28px 24px 40px; }
    .editor-header { display: flex; justify-content: space-between; gap: 24px; align-items: end; margin-bottom: 24px; }
    .ghost-link { border: none; background: transparent; color: var(--muted); padding: 0; margin-bottom: 12px; }
    .eyebrow { margin: 0 0 8px; color: var(--accent); letter-spacing: 0.24em; text-transform: uppercase; font-size: 0.76rem; }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.1rem); line-height: 1; }
    .header-actions { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; justify-content: end; }
    .template-switcher { display: flex; flex-direction: column; gap: 6px; color: var(--muted); font-size: 0.82rem; }
    .template-switcher select {
      min-width: 220px;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 12px;
      background: var(--surface);
      color: var(--text);
    }
    .primary-button,
    .secondary-button,
    .icon-button {
      border-radius: 12px;
      padding: 11px 16px;
      border: 1px solid transparent;
      font-weight: 600;
    }
    .primary-button { background: linear-gradient(135deg, var(--accent), #df8f65); color: #121212; }
    .secondary-button { background: transparent; color: var(--text); border-color: var(--border); }
    .primary-button:disabled,
    .secondary-button:disabled,
    .icon-button:disabled { opacity: 0.45; cursor: not-allowed; }
    .validation-banner {
      margin-bottom: 18px;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(240, 192, 96, 0.1);
      border: 1px solid rgba(240, 192, 96, 0.22);
      color: #f4ddb0;
      line-height: 1.6;
    }
    .editor-layout { display: grid; grid-template-columns: minmax(320px, 420px) 1fr; gap: 22px; align-items: start; }
    .form-panel {
      background: rgba(19, 20, 27, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 24px;
      overflow: hidden;
      position: sticky;
      top: 18px;
    }
    .tabs { display: flex; overflow-x: auto; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .tab {
      border: none;
      background: transparent;
      color: var(--muted);
      padding: 16px 18px;
      min-width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.78rem;
      border-bottom: 2px solid transparent;
    }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .form-body { padding: 22px; max-height: calc(100vh - 180px); overflow: auto; }
    .field-group { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
    .field-group label { color: var(--muted); text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.08em; }
    .field-group input,
    .field-group textarea {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface2);
      color: var(--text);
      padding: 12px 14px;
      resize: vertical;
    }
    editor { display: block; }
    :host ::ng-deep .tox {
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(88, 166, 255, 0.16);
      box-shadow: inset 0 0 0 1px rgba(88, 166, 255, 0.05);
    }
    :host ::ng-deep .tox .tox-editor-header,
    :host ::ng-deep .tox .tox-menubar,
    :host ::ng-deep .tox .tox-toolbar-overlord { background: #161d29; }
    :host ::ng-deep .tox .tox-edit-area__iframe { background: #0d121b; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .section-head { display: flex; justify-content: space-between; gap: 16px; align-items: start; margin-bottom: 16px; }
    .section-head h2 { margin: 0 0 4px; font-size: 1.1rem; }
    .section-head p { margin: 0; color: var(--muted); line-height: 1.5; }
    .entry-card {
      background: rgba(31, 32, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 14px;
    }
    .compact-card { padding-bottom: 8px; }
    .entry-actions { display: flex; gap: 8px; justify-content: end; margin-bottom: 8px; }
    .icon-button { background: rgba(255, 255, 255, 0.04); color: var(--text); border-color: rgba(255, 255, 255, 0.08); padding-inline: 12px; }
    .icon-button.danger { color: #ffb0b0; border-color: rgba(255, 101, 101, 0.25); }
    .skill-row {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 8px;
      margin-bottom: 10px;
      align-items: center;
    }
    .skill-row input {
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface2);
      color: var(--text);
      padding: 12px 14px;
    }
    .preview-panel {
      background: rgba(19, 20, 27, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 24px;
      padding: 22px;
    }
    @media (max-width: 1080px) {
      .editor-layout { grid-template-columns: 1fr; }
      .form-panel { position: static; }
      .form-body { max-height: none; }
      .editor-header { flex-direction: column; align-items: start; }
      .header-actions { justify-content: start; }
    }
    @media (max-width: 680px) {
      .editor-shell { padding-inline: 14px; }
      .field-grid { grid-template-columns: 1fr; }
      .skill-row { grid-template-columns: 1fr; }
      .entry-actions { justify-content: start; flex-wrap: wrap; }
    }
  `]
})
export class ResumeEditorComponent {
  @ViewChild('preview') previewComponent?: ResumePreviewComponent;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly store = inject(ResumeStoreService);
  private readonly destroyRef = inject(DestroyRef);

  readonly templateCards = TEMPLATE_CARDS;
  readonly sections: ReadonlyArray<{ id: SectionId; label: string }> = [
    { id: 'basics', label: 'Personal Info' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'languages', label: 'Languages' },
    { id: 'links', label: 'Links' },
    { id: 'custom', label: 'Custom Sections' }
  ];

  activeSection: SectionId = 'basics';
  selectedTemplate: ResumeTemplateId = this.store.getTemplate();
  exporting = false;
  previewData: ResumeData = createEmptyResumeData();
  readonly experienceEditorConfig: RawEditorOptions = {
    menubar: false,
    branding: false,
    promotion: false,
    height: 260,
    statusbar: false,
    plugins: 'lists link autolink code',
    toolbar: 'undo redo | bold italic underline | bullist numlist | link | code',
    placeholder: 'Write bullet points, impact metrics, and project notes.',
    browser_spellcheck: true,
    contextmenu: false,
    content_style:
      'body { font-family: Consolas, Courier New, monospace; font-size:14px; line-height:1.7; margin:12px; } p, ul, ol { margin: 0 0 10px; }'
  };

  readonly form = this.fb.nonNullable.group({
    basics: this.fb.nonNullable.group({
      name: ['', Validators.required],
      title: ['', Validators.required],
      email: [''],
      phone: [''],
      location: [''],
      website: ['']
    }),
    summary: this.fb.nonNullable.control(''),
    experience: this.fb.nonNullable.array<ExperienceForm>([]),
    education: this.fb.nonNullable.array<EducationForm>([]),
    skills: this.fb.nonNullable.array<SkillForm>([]),
    languages: this.fb.nonNullable.array<LanguageForm>([]),
    customSections: this.fb.nonNullable.array<CustomSectionForm>([]),
    links: this.fb.nonNullable.array<LinkForm>([])
  });

  constructor() {
    this.hydrateForm(this.store.getSnapshot());
    this.previewData = this.buildResumeData();

    this.store.template$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((templateId) => {
        this.selectedTemplate = templateId;
      });

    this.form.valueChanges
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const nextData = this.buildResumeData();
        this.previewData = nextData;
        this.store.saveDraft(nextData);
      });
  }

  get experienceArray(): FormArray<ExperienceForm> { return this.form.controls.experience; }
  get educationArray(): FormArray<EducationForm> { return this.form.controls.education; }
  get skillsArray(): FormArray<SkillForm> { return this.form.controls.skills; }
  get languagesArray(): FormArray<LanguageForm> { return this.form.controls.languages; }
  get customSectionsArray(): FormArray<CustomSectionForm> { return this.form.controls.customSections; }
  get linksArray(): FormArray<LinkForm> { return this.form.controls.links; }

  get experienceControls(): ExperienceForm[] { return this.experienceArray.controls; }
  get educationControls(): EducationForm[] { return this.educationArray.controls; }
  get skillControls(): SkillForm[] { return this.skillsArray.controls; }
  get languageControls(): LanguageForm[] { return this.languagesArray.controls; }
  get customSectionControls(): CustomSectionForm[] { return this.customSectionsArray.controls; }
  get linkControls(): LinkForm[] { return this.linksArray.controls; }

  get canExport(): boolean {
    return isResumeValid(this.previewData);
  }

  get showValidationHint(): boolean {
    const data = this.previewData;
    return !data.basics.name.trim() || !data.basics.title.trim() || !hasRenderableContent(data);
  }

  addExperience(): void { this.experienceArray.push(this.createExperienceGroup(createExperienceItem())); }
  removeExperience(index: number): void {
    if (this.experienceArray.length === 1) {
      this.experienceArray.at(0).reset(createExperienceItem());
      return;
    }
    this.experienceArray.removeAt(index);
  }
  moveExperience(index: number, offset: -1 | 1): void { this.moveControl(this.experienceArray, index, index + offset); }

  addEducation(): void { this.educationArray.push(this.createEducationGroup(createEducationItem())); }
  removeEducation(index: number): void {
    if (this.educationArray.length === 1) {
      this.educationArray.at(0).reset(createEducationItem());
      return;
    }
    this.educationArray.removeAt(index);
  }
  moveEducation(index: number, offset: -1 | 1): void { this.moveControl(this.educationArray, index, index + offset); }

  addCustomSection(): void { this.customSectionsArray.push(this.createCustomSectionGroup(createCustomSectionItem())); }
  removeCustomSection(index: number): void {
    if (this.customSectionsArray.length === 1) {
      this.customSectionsArray.at(0).reset(createCustomSectionItem());
      return;
    }
    this.customSectionsArray.removeAt(index);
  }
  moveCustomSection(index: number, offset: -1 | 1): void { this.moveControl(this.customSectionsArray, index, index + offset); }

  addSkill(): void { this.skillsArray.push(this.createSkillGroup(createSkillItem())); }
  removeSkill(index: number): void {
    if (this.skillsArray.length === 1) {
      this.skillsArray.at(0).reset(createSkillItem());
      return;
    }
    this.skillsArray.removeAt(index);
  }
  moveSkill(index: number, offset: -1 | 1): void { this.moveControl(this.skillsArray, index, index + offset); }

  addLanguage(): void { this.languagesArray.push(this.createLanguageGroup(createLanguageItem())); }
  removeLanguage(index: number): void {
    if (this.languagesArray.length === 1) {
      this.languagesArray.at(0).reset(createLanguageItem());
      return;
    }
    this.languagesArray.removeAt(index);
  }
  moveLanguage(index: number, offset: -1 | 1): void { this.moveControl(this.languagesArray, index, index + offset); }

  addLink(): void { this.linksArray.push(this.createLinkGroup(createLinkItem())); }
  removeLink(index: number): void {
    if (this.linksArray.length === 1) {
      this.linksArray.at(0).reset(createLinkItem());
      return;
    }
    this.linksArray.removeAt(index);
  }
  moveLink(index: number, offset: -1 | 1): void { this.moveControl(this.linksArray, index, index + offset); }

  onTemplateChange(templateId: ResumeTemplateId): void {
    this.selectedTemplate = templateId;
    this.store.setTemplate(templateId);
  }

  backToTemplates(): void {
    void this.router.navigate(['/']);
  }

  resetDraft(): void {
    const empty = createEmptyResumeData();
    this.hydrateForm(empty);
    this.previewData = this.buildResumeData();
    this.store.clearDraft();
  }

  async exportPdf(): Promise<void> {
    if (!this.canExport || !this.previewComponent) {
      return;
    }

    this.exporting = true;
    try {
      await this.previewComponent.exportPdf();
    } finally {
      this.exporting = false;
    }
  }

  private buildResumeData(): ResumeData {
    return {
      basics: this.form.controls.basics.getRawValue(),
      summary: this.form.controls.summary.getRawValue(),
      experience: this.experienceArray.getRawValue(),
      education: this.educationArray.getRawValue(),
      skills: this.skillsArray.getRawValue(),
      languages: this.languagesArray.getRawValue(),
      customSections: this.customSectionsArray.getRawValue(),
      links: this.linksArray.getRawValue()
    };
  }

  private hydrateForm(data: ResumeData): void {
    this.form.controls.basics.patchValue(data.basics, { emitEvent: false });
    this.form.controls.summary.setValue(data.summary, { emitEvent: false });
    this.resetArray(this.experienceArray, data.experience.length ? data.experience : [createExperienceItem()], (item) => this.createExperienceGroup(item));
    this.resetArray(this.educationArray, data.education.length ? data.education : [createEducationItem()], (item) => this.createEducationGroup(item));
    this.resetArray(this.skillsArray, data.skills.length ? data.skills : [createSkillItem()], (item) => this.createSkillGroup(item));
    this.resetArray(this.languagesArray, data.languages.length ? data.languages : [createLanguageItem()], (item) => this.createLanguageGroup(item));
    this.resetArray(this.customSectionsArray, data.customSections.length ? data.customSections : [createCustomSectionItem()], (item) => this.createCustomSectionGroup(item));
    this.resetArray(this.linksArray, data.links.length ? data.links : [createLinkItem()], (item) => this.createLinkGroup(item));
  }

  private resetArray<T, TForm extends FormGroup>(array: FormArray<TForm>, items: T[], factory: (item: T) => TForm): void {
    while (array.length) {
      array.removeAt(0, { emitEvent: false });
    }
    for (const item of items) {
      array.push(factory(item), { emitEvent: false });
    }
  }

  private createExperienceGroup(item: ResumeExperienceItem): ExperienceForm {
    return this.fb.nonNullable.group({
      id: item.id,
      company: item.company,
      role: item.role,
      period: item.period,
      description: item.description
    });
  }

  private createEducationGroup(item: ResumeEducationItem): EducationForm {
    return this.fb.nonNullable.group({
      id: item.id,
      institution: item.institution,
      degree: item.degree,
      period: item.period,
      description: item.description
    });
  }

  private createSkillGroup(item: ResumeSkillItem): SkillForm {
    return this.fb.nonNullable.group({
      id: item.id,
      name: item.name
    });
  }

  private createLanguageGroup(item: ResumeLanguageItem): LanguageForm {
    return this.fb.nonNullable.group({
      id: item.id,
      name: item.name,
      proficiency: item.proficiency
    });
  }

  private createCustomSectionGroup(item: ResumeCustomSectionItem): CustomSectionForm {
    return this.fb.nonNullable.group({
      id: item.id,
      title: item.title,
      content: item.content
    });
  }

  private createLinkGroup(item: ResumeLinkItem): LinkForm {
    return this.fb.nonNullable.group({
      id: item.id,
      label: item.label,
      url: item.url
    });
  }

  private moveControl<T extends AbstractControl>(array: FormArray<T>, from: number, to: number): void {
    if (from < 0 || from >= array.length || to < 0 || to >= array.length || from === to) {
      return;
    }

    const controls = array.controls as T[];
    const [control] = controls.splice(from, 1);
    if (!control) {
      return;
    }

    controls.splice(to, 0, control);
    array.updateValueAndValidity();
    array.markAsDirty();
  }
}



