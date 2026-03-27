import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BaseTemplateComponent } from './base-template.component';
import { CompactTemplateShellComponent } from './compact-template-shell.component';

@Component({
  selector: 'app-mono-template',
  standalone: true,
  imports: [CompactTemplateShellComponent],
  template: `
    <app-compact-template-shell
      [data]="data"
      [page]="page"
      [pageIndex]="pageIndex"
      [mode]="mode"
      variant="mono"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonoTemplateComponent extends BaseTemplateComponent {}
