import { Routes } from '@angular/router';

import { ResumeEditorComponent } from './components/resume-editor.component';
import { TemplateGalleryComponent } from './components/template-gallery.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: TemplateGalleryComponent
  },
  {
    path: 'editor',
    component: ResumeEditorComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
