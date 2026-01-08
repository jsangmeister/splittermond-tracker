import { CommonModule } from '@angular/common';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipDefaultOptions,
  MatTooltipModule,
} from '@angular/material/tooltip';
import {
  Component,
  effect,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Char } from './models/char';
import * as xml2js from 'xml2js';
import { CharacterService } from './services/character-service';
import { CharacterContainerComponent } from './components/character-container/character-container.component';

declare global {
  interface Window {
    electron: any;
  }
}

enum LoadCharacterMode {
  Default = 0,
  AlwaysAsk = 1,
  NeverAsk = 2,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, MatTooltipModule, CharacterContainerComponent],
  providers: [
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        tooltipClass: 'multiline-tooltip',
      } as MatTooltipDefaultOptions,
    },
  ],
})
export class AppComponent implements OnInit {
  private charService = inject(CharacterService);

  protected char = signal<Char | undefined>(undefined);

  private charComponent = viewChild(CharacterContainerComponent);

  public constructor() {
    effect(() => {
      const width = this.charComponent()?.width();
      const height = this.charComponent()?.height();
      if (width && height) {
        console.log(`Setting window size to ${width}x${height}`);
        window.electron.setWindowSize(width, height);
      }
    });
  }

  public ngOnInit(): void {
    void this.loadCharacter(LoadCharacterMode.NeverAsk);
  }

  private async loadCharacter(mode = LoadCharacterMode.Default): Promise<void> {
    const xmlContent = await window.electron.loadCharacter(mode);
    if (xmlContent) {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlContent);
      const char = await this.charService.createChar(result);
      if (!char) {
        console.error('Char could not be created');
      } else {
        this.char.set(char);
      }
    }
  }

  public showCredits(): void {
    void window.electron.showCredits();
  }
}
