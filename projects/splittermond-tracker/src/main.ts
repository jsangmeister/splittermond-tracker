import { registerLocaleData } from '@angular/common';
import de from '@angular/common/locales/de';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { de_DE, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideMarkdown } from 'ngx-markdown';

import { AppComponent } from './app/app.component';

registerLocaleData(de);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideMarkdown(),
    provideNzI18n(de_DE),
  ],
}).catch((err: unknown) => {
  console.error(err);
});
