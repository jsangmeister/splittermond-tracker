import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideMarkdown } from 'ngx-markdown';

import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection(), provideMarkdown()],
}).catch((err: unknown) => {
  console.error(err);
});
