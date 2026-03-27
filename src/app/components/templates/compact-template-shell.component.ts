import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { BaseTemplateComponent } from './base-template.component';

@Component({
  selector: 'app-compact-template-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="compact-shell" [ngClass]="['variant-' + variant, showHeader() ? 'with-header' : 'without-header']">
      <header class="hero" *ngIf="showHeader()">
        <div class="identity">
          <h1>{{ data.basics.name || 'Your Name' }}</h1>
          <p class="role">{{ data.basics.title || 'Target Role' }}</p>
        </div>
        <div class="contact" *ngIf="contactItems().length">
          <span *ngFor="let item of contactItems()">{{ item }}</span>
        </div>
      </header>

      <section class="section-block summary-card" *ngIf="hasSummary()">
        <div class="section-kicker">Summary</div>
        <div class="summary-copy">{{ page.summary }}</div>
      </section>

      <section class="section-block" *ngIf="hasExperience()">
        <div class="section-kicker">Experience</div>
        <article class="entry" *ngFor="let item of page.experience">
          <div class="entry-row">
            <div>
              <h3>{{ item.role || 'Role' }}</h3>
              <p class="meta">{{ item.company || 'Company' }}</p>
            </div>
            <p class="meta align-right" *ngIf="item.period">{{ item.period }}</p>
          </div>
          <div class="rich-copy" *ngIf="item.description" [innerHTML]="item.description"></div>
        </article>
      </section>

      <section class="section-block" *ngIf="hasEducation()">
        <div class="section-kicker">Education</div>
        <article class="entry compact" *ngFor="let item of page.education">
          <div class="entry-row">
            <div>
              <h3>{{ item.degree || 'Degree' }}</h3>
              <p class="meta">{{ item.institution || 'Institution' }}</p>
            </div>
            <p class="meta align-right" *ngIf="item.period">{{ item.period }}</p>
          </div>
          <div class="plain-copy" *ngIf="item.description">{{ item.description }}</div>
        </article>
      </section>

      <section class="section-block" *ngIf="hasSkills()">
        <div class="section-kicker">Skills</div>
        <div class="comma-copy">{{ skillsText() }}</div>
      </section>

      <section class="section-block" *ngIf="hasLanguages()">
        <div class="section-kicker">Languages</div>
        <div class="comma-copy">{{ languagesText() }}</div>
      </section>

      <section class="section-block" *ngIf="hasLinks()">
        <div class="section-kicker">Links</div>
        <div class="comma-copy links-copy">
          <ng-container *ngFor="let link of linkItems(); let last = last">
            <a [href]="link.href" target="_blank" rel="noreferrer noopener">{{ link.label }}</a><span *ngIf="!last">, </span>
          </ng-container>
        </div>
      </section>
      <section class="section-block" *ngIf="hasCustomSections()">
        <article class="entry compact" *ngFor="let item of page.customSections">
          <div class="section-kicker">{{ item.title || 'Custom Section' }}</div>
          <div class="plain-copy" *ngIf="item.content">{{ item.content }}</div>
        </article>
      </section>
    </article>
  `,
  styles: [`
    .compact-shell {
      --page-ink: #13202b;
      --page-muted: #5d6a74;
      --page-line: #d7dfe4;
      --page-accent: #1d5f96;
      background: #ffffff;
      color: var(--page-ink);
      font-family: 'IBM Plex Sans', sans-serif;
      min-height: 100%;
      padding: 24px 28px 22px;
      line-height: 1.34;
    }
    .compact-shell.without-header { padding-top: 18px; }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      align-items: end;
      border-bottom: 1px solid var(--page-line);
      padding-bottom: 10px;
      margin-bottom: 8px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.02;
      letter-spacing: -0.04em;
    }
    .role {
      margin: 3px 0 0;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--page-muted);
    }
    .contact {
      display: flex;
      flex-wrap: wrap;
      justify-content: end;
      gap: 4px 8px;
      max-width: 300px;
      font-size: 9.4px;
      color: var(--page-muted);
      text-align: right;
    }
    .section-block { margin-bottom: 7px; }
    .section-kicker {
      margin-bottom: 3px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--page-accent);
    }
    .entry,
    .comma-copy {
      border-top: 1px solid rgba(215, 223, 228, 0.92);
      padding-top: 4px;
      margin-top: 0;
    }
    .entry.compact { padding-top: 3px; }
    .entry-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: start;
    }
    h3 {
      margin: 0;
      font-size: 11.8px;
      font-weight: 700;
      line-height: 1.18;
    }
    .meta {
      margin: 0;
      font-size: 9.8px;
      color: var(--page-muted);
      line-height: 1.2;
      word-break: break-word;
    }
    .align-right { text-align: right; }
    .summary-copy,
    .plain-copy,
    .rich-copy,
    .comma-copy {
      font-size: 10px;
      color: #27333c;
      line-height: 1.3;
      white-space: pre-line;
      word-break: break-word;
    }
    .plain-copy,
    .rich-copy { margin-top: 2px; }
    .rich-copy:empty { display: none; }
    .rich-copy ::ng-deep p,
    .rich-copy ::ng-deep ul,
    .rich-copy ::ng-deep ol { margin: 0 0 2px; }
    .rich-copy ::ng-deep ul,
    .rich-copy ::ng-deep ol { padding-left: 14px; }
    .links-copy a { color: var(--page-accent); text-decoration: underline; text-underline-offset: 2px; }
    .variant-atlas { --page-accent: #1d5f96; }
    .variant-aurora { --page-accent: #2563eb; --page-line: #dbe6fb; background: linear-gradient(180deg, #fbfdff, #ffffff 14%); }
    .variant-breeze { --page-accent: #167c74; --page-line: #d2e6e2; }
    .variant-cedar { --page-accent: #8b5a2b; --page-line: #e7d9ca; font-family: 'Source Serif 4', serif; }
    .variant-ember { --page-accent: #c05621; --page-line: #f0ddd1; }
    .variant-graphite { --page-accent: #111827; --page-line: #d3d8e1; background: linear-gradient(180deg, #fcfcfd, #ffffff); }
    .variant-iris { --page-accent: #635bff; --page-line: #dfddff; background: linear-gradient(180deg, #fbfaff, #ffffff 14%); }
    .variant-mono { --page-accent: #111827; --page-line: #dcdfe4; font-family: 'IBM Plex Mono', monospace; }
    .variant-signal { --page-accent: #dc2626; --page-line: #f4d2d2; }
    .variant-zen { --page-accent: #4f46e5; --page-line: #dde0fb; }
    .variant-aurora .hero,
    .variant-iris .hero,
    .variant-signal .hero { border-bottom-width: 2px; }
    .variant-cedar h1,
    .variant-cedar h3 { font-family: 'Cormorant Garamond', serif; }
    .variant-graphite h1 { text-transform: uppercase; letter-spacing: 0.04em; font-size: 22px; }
    .variant-mono h1 { letter-spacing: -0.02em; font-size: 22px; }
    @media (max-width: 720px) {
      .compact-shell { padding-inline: 18px; }
      .hero,
      .entry-row { grid-template-columns: 1fr; }
      .contact,
      .align-right { text-align: left; justify-content: start; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompactTemplateShellComponent extends BaseTemplateComponent {
  @Input({ required: true }) variant!:
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
}

