import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { TEMPLATE_CARDS } from '../data/template-metadata';
import { ResumeTemplateId } from '../models/resume.models';
import { ResumeStoreService } from '../services/resume-store.service';

@Component({
  selector: 'app-template-gallery',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-shell">
      <header class="hero">
        <p class="eyebrow">ResumeForge</p>
        <h1>Choose from 10 different compact templates.</h1>
        <p class="subcopy">
          Each template is designed to look distinct while still packing content tightly enough
          for strong one-page or two-page resumes.
        </p>
      </header>

      <div class="gallery-grid">
        <button
          *ngFor="let card of cards"
          class="template-card"
          type="button"
          [class.selected]="card.id === selectedTemplate"
          (click)="select(card.id)"
        >
          <div class="template-check">{{ card.id === selectedTemplate ? 'Selected' : 'Compact' }}</div>
          <div class="template-thumb">
            <div class="mini-resume" [ngClass]="card.previewClass">
              <div class="mini-top"></div>
              <div class="mini-grid">
                <div class="mini-main">
                  <div class="line w90"></div>
                  <div class="line w60"></div>
                  <div class="line w100"></div>
                  <div class="line w85"></div>
                  <div class="line w70"></div>
                </div>
                <div class="mini-side">
                  <div class="pill"></div>
                  <div class="pill short"></div>
                  <div class="line w80"></div>
                  <div class="line w70"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="template-label">
            <strong>{{ card.name }}</strong>
            <span>{{ card.description }}</span>
          </div>
        </button>
      </div>

      <div class="hero-actions">
        <button class="primary-button" type="button" (click)="continueToEditor()">
          Continue with {{ selectedLabel }}
        </button>
      </div>
    </section>
  `,
  styles: [`
    .page-shell { padding: 48px 32px 72px; }
    .hero { max-width: 820px; margin: 0 auto 36px; text-align: center; }
    .eyebrow { margin: 0 0 8px; color: var(--accent); letter-spacing: 0.32em; text-transform: uppercase; font-size: 0.75rem; font-weight: 700; }
    h1 { margin: 0; font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 7vw, 4rem); line-height: 0.98; }
    .subcopy { margin: 18px auto 0; max-width: 680px; color: var(--muted); font-size: 1.05rem; line-height: 1.7; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 22px; max-width: 1240px; margin: 0 auto; }
    .template-card { position: relative; border: 2px solid var(--border); border-radius: 20px; background: linear-gradient(180deg, rgba(31, 32, 42, 0.95), rgba(19, 20, 27, 0.98)); color: inherit; overflow: hidden; transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease; text-align: left; padding: 0; box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2); }
    .template-card:hover, .template-card.selected { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 24px 48px rgba(0, 0, 0, 0.32); }
    .template-check { position: absolute; top: 12px; right: 12px; z-index: 1; padding: 6px 10px; border-radius: 999px; background: rgba(11, 11, 15, 0.74); color: var(--accent-strong); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .template-thumb { aspect-ratio: 0.707; overflow: hidden; }
    .template-label { padding: 16px 18px 18px; border-top: 1px solid rgba(255, 255, 255, 0.06); }
    .template-label strong { display: block; margin-bottom: 4px; font-size: 1rem; }
    .template-label span { color: var(--muted); line-height: 1.5; font-size: 0.88rem; }
    .hero-actions { display: flex; justify-content: center; margin-top: 36px; }
    .primary-button { border: none; border-radius: 999px; background: linear-gradient(135deg, var(--accent), #df8f65); color: #151515; padding: 14px 24px; font-weight: 700; min-width: 280px; box-shadow: 0 12px 30px rgba(240, 192, 96, 0.24); }
    .mini-resume {
      width: 100%;
      height: 100%;
      padding: 14px;
      display: grid;
      grid-template-rows: auto 1fr;
      gap: 10px;
      background: #fff;
      color: #111;
    }
    .mini-top { height: 18px; border-radius: 10px; width: 72%; background: currentColor; opacity: 0.16; }
    .mini-grid { display: grid; grid-template-columns: 1.5fr 0.95fr; gap: 8px; }
    .mini-main, .mini-side { display: flex; flex-direction: column; gap: 5px; }
    .line { height: 4px; border-radius: 999px; background: currentColor; opacity: 0.14; }
    .pill { height: 18px; border-radius: 999px; background: currentColor; opacity: 0.1; }
    .pill.short { width: 72%; }
    .w100 { width: 100%; }
    .w90 { width: 90%; }
    .w85 { width: 85%; }
    .w80 { width: 80%; }
    .w70 { width: 70%; }
    .w60 { width: 60%; }
    .mini-atlas { color: #1d5f96; }
    .mini-aurora { color: #2563eb; background: linear-gradient(180deg, #f8fbff, #ffffff); }
    .mini-breeze { color: #167c74; background: linear-gradient(180deg, #f7fffd, #ffffff); }
    .mini-cedar { color: #8b5a2b; background: linear-gradient(180deg, #fffaf5, #ffffff); }
    .mini-ember { color: #c05621; background: linear-gradient(180deg, #fff7f2, #ffffff); }
    .mini-graphite { color: #111827; background: linear-gradient(180deg, #fbfcfd, #ffffff); }
    .mini-iris { color: #635bff; background: linear-gradient(180deg, #faf9ff, #ffffff); }
    .mini-mono { color: #111827; font-family: 'IBM Plex Mono', monospace; }
    .mini-signal { color: #dc2626; background: linear-gradient(180deg, #fff6f6, #ffffff); }
    .mini-zen { color: #4f46e5; background: linear-gradient(180deg, #f5f7ff, #ffffff); }
    @media (max-width: 768px) { .page-shell { padding-inline: 18px; } }
  `]
})
export class TemplateGalleryComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ResumeStoreService);

  readonly cards = TEMPLATE_CARDS;
  selectedTemplate = this.store.getTemplate();

  get selectedLabel(): string {
    return this.cards.find((card) => card.id === this.selectedTemplate)?.name ?? 'this template';
  }

  select(templateId: ResumeTemplateId): void {
    this.selectedTemplate = templateId;
    this.store.setTemplate(templateId);
  }

  continueToEditor(): void {
    void this.router.navigate(['/editor']);
  }
}
