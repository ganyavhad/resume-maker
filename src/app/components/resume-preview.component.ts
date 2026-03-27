import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { ResumeData, ResumeLinkItem, ResumePageData, ResumeTemplateId } from '../models/resume.models';
import { hasRenderableContent, paginateResumeData } from '../utils/resume-paginator';
import { AtlasTemplateComponent } from './templates/atlas-template.component';
import { AuroraTemplateComponent } from './templates/aurora-template.component';
import { BreezeTemplateComponent } from './templates/breeze-template.component';
import { CedarTemplateComponent } from './templates/cedar-template.component';
import { EmberTemplateComponent } from './templates/ember-template.component';
import { GraphiteTemplateComponent } from './templates/graphite-template.component';
import { IrisTemplateComponent } from './templates/iris-template.component';
import { MonoTemplateComponent } from './templates/mono-template.component';
import { SignalTemplateComponent } from './templates/signal-template.component';
import { ZenTemplateComponent } from './templates/zen-template.component';

@Component({
  selector: 'app-resume-preview',
  standalone: true,
  imports: [
    CommonModule,
    AtlasTemplateComponent,
    AuroraTemplateComponent,
    BreezeTemplateComponent,
    CedarTemplateComponent,
    EmberTemplateComponent,
    GraphiteTemplateComponent,
    IrisTemplateComponent,
    MonoTemplateComponent,
    SignalTemplateComponent,
    ZenTemplateComponent
  ],
  template: `
    <section class="preview-root">
      <div class="preview-toolbar">
        <div>
          <p class="preview-label">Live preview</p>
          <h2>{{ pages.length }} page{{ pages.length === 1 ? '' : 's' }} on A4</h2>
        </div>
        <p class="preview-hint">These 10 templates are tuned for compact two-page resumes.</p>
      </div>

      <div class="empty-state" *ngIf="!hasContent">
        <h3>Start filling in the form to build your resume.</h3>
        <p>
          Add a summary, experience, education, custom sections, skills, languages,
          or links and the compact preview will format itself here.
        </p>
      </div>

      <div class="pages" *ngIf="hasContent">
        <article class="page-frame" *ngFor="let page of pages; let index = index" #pageRef>
          <div class="page-shell">
            <ng-container [ngSwitch]="templateId">
              <app-atlas-template *ngSwitchCase="'atlas'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-aurora-template *ngSwitchCase="'aurora'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-breeze-template *ngSwitchCase="'breeze'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-cedar-template *ngSwitchCase="'cedar'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-ember-template *ngSwitchCase="'ember'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-graphite-template *ngSwitchCase="'graphite'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-iris-template *ngSwitchCase="'iris'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-mono-template *ngSwitchCase="'mono'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-signal-template *ngSwitchCase="'signal'" [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
              <app-zen-template *ngSwitchDefault [data]="data" [page]="page" [pageIndex]="index" [mode]="mode" />
            </ng-container>
          </div>
          <div class="page-index">Page {{ index + 1 }}</div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .preview-root { display: flex; flex-direction: column; gap: 22px; }
    .preview-toolbar { display: flex; justify-content: space-between; gap: 20px; align-items: end; }
    .preview-label { margin: 0 0 6px; color: var(--accent); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.24em; }
    h2 { margin: 0; font-size: 1.5rem; }
    .preview-hint { margin: 0; color: var(--muted); max-width: 360px; line-height: 1.6; text-align: right; }
    .pages { display: flex; flex-direction: column; gap: 22px; }
    .page-frame { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .page-shell {
      width: min(var(--page-width), 100%);
      min-height: var(--page-height);
      background: white;
      color: #111;
      box-shadow: var(--shadow);
      border-radius: 10px;
      overflow: hidden;
    }
    .page-index { color: var(--muted); font-size: 0.82rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .empty-state {
      border: 1px dashed rgba(255, 255, 255, 0.14);
      border-radius: 24px;
      padding: 36px;
      background: rgba(15, 15, 21, 0.5);
    }
    .empty-state h3 { margin: 0 0 10px; font-size: 1.2rem; }
    .empty-state p { margin: 0; color: var(--muted); line-height: 1.7; }
    @media (max-width: 900px) {
      .preview-toolbar { align-items: start; flex-direction: column; }
      .preview-hint { text-align: left; }
      .page-shell { min-height: auto; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumePreviewComponent {
  @Input({ required: true }) data!: ResumeData;
  @Input({ required: true }) templateId: ResumeTemplateId = 'atlas';
  @Input() mode: 'preview' | 'export' = 'preview';

  @ViewChildren('pageRef', { read: ElementRef }) pageElements!: QueryList<ElementRef<HTMLElement>>;

  get pages(): ResumePageData[] {
    return paginateResumeData(this.data);
  }

  get hasContent(): boolean {
    return hasRenderableContent(this.data);
  }

  async exportPdf(): Promise<void> {
    if (!this.hasContent) {
      return;
    }

    const pageNodes = this.pageElements.toArray();
    if (!pageNodes.length) {
      return;
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let index = 0; index < pageNodes.length; index += 1) {
      const pageNode = pageNodes[index].nativeElement.querySelector('.page-shell');
      if (!pageNode) {
        continue;
      }

      const canvas = await html2canvas(pageNode as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const image = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (index > 0) {
        pdf.addPage();
      }
      pdf.addImage(image, 'PNG', 0, 0, pageWidth, pageHeight);
    }

    this.appendClickableLinksPage(pdf);

    const fileName = `${(this.data.basics.name || 'Resume').trim().replace(/\s+/g, '_')}_Resume.pdf`;
    pdf.save(fileName);
  }

  private appendClickableLinksPage(pdf: jsPDF): void {
    const links = this.exportLinks();
    if (!links.length) {
      return;
    }

    pdf.addPage();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const left = 18;
    const right = pageWidth - 18;
    let y = 24;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(20, 28, 40);
    pdf.text('Links', left, y);
    y += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(80, 88, 99);
    pdf.text('These links are clickable in the exported PDF.', left, y);
    y += 10;

    for (const link of links) {
      if (y > 270) {
        pdf.addPage();
        y = 24;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(27, 82, 181);
      pdf.textWithLink(link.label, left, y, { url: link.href });
      y += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(95, 104, 116);
      const urlLines = pdf.splitTextToSize(link.href, right - left);
      pdf.text(urlLines, left, y);
      y += urlLines.length * 4 + 4;
    }
  }

  private exportLinks(): Array<{ label: string; href: string }> {
    return this.data.links
      .map((item: ResumeLinkItem) => {
        const rawUrl = item.url.trim();
        if (!rawUrl) {
          return null;
        }
        const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        const label = item.label.trim() || rawUrl;
        return { label, href };
      })
      .filter((item): item is { label: string; href: string } => Boolean(item));
  }
}


