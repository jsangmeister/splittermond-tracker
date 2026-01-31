import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipDefaultOptions,
  MatTooltipModule,
} from '@angular/material/tooltip';
import {
  MAT_TABS_CONFIG,
  MatTabsConfig,
  MatTabsModule,
} from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Char } from './models/char';
import * as xml2js from 'xml2js';
import { CharacterService } from './services/character-service';
import { CharacterContainerComponent } from './components/character-container/character-container.component';

declare global {
  interface Window {
    electron: {
      getCharacters: () => Promise<{ path: string; content: string }[]>;
      confirm: (message: string) => Promise<boolean>;
      storage: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, data: unknown) => Promise<void>;
      };
      showCredits: () => Promise<void>;
    };
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    MatTooltipModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    CharacterContainerComponent,
  ],
  providers: [
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        tooltipClass: 'multiline-tooltip',
      } as MatTooltipDefaultOptions,
    },
    {
      provide: MAT_TABS_CONFIG,
      useValue: {
        animationDuration: '0ms',
      } as MatTabsConfig,
    },
  ],
})
export class AppComponent implements OnInit {
  protected chars = signal<Char[]>([]);

  protected characters: Promise<Char[]> = window.electron
    .getCharacters()
    .then(async (res) =>
      (
        await Promise.all(
          res.map(
            async ({ path, content }) =>
              await this.loadCharacter(content, path),
          ),
        )
      ).filter((c) => c !== undefined),
    );

  protected selectedIndex = signal(0);

  private charService = inject(CharacterService);

  private parser = new xml2js.Parser({ explicitArray: false });

  public async ngOnInit(): Promise<void> {
    const characters = await this.characters;
    const lastCharacters = (await window.electron.storage.get(
      'last-characters',
    )) as string[] | undefined;
    if (lastCharacters) {
      this.chars.set(characters.filter((c) => lastCharacters.includes(c.path)));
    }

    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) {
          this.previousTab();
        } else {
          this.nextTab();
        }
      }
    });
  }

  public async close(char: Char): Promise<void> {
    this.chars.update((chars) => chars.filter((c) => c !== char));
    await window.electron.storage.set(
      'last-characters',
      this.chars().map((c) => c.path),
    );
  }

  public async open(): Promise<void> {
    const characters = await this.characters;
    const newChars = characters.filter((c) => !this.chars().includes(c));
    if (newChars.length > 0) {
      this.chars.update((chars) => chars.concat(newChars[0]));
      await window.electron.storage.set(
        'last-characters',
        this.chars().map((c) => c.path),
      );
    }
  }

  public nextTab(): void {
    this.changeTab(1);
  }

  public previousTab(): void {
    this.changeTab(-1);
  }
  private changeTab(offset: number): void {
    if (this.chars().length) {
      const newIndex =
        (this.selectedIndex() + offset + this.chars().length) %
        this.chars().length;
      this.selectedIndex.set(newIndex);
    }
  }

  private async loadCharacter(
    xmlContent: string,
    path: string,
  ): Promise<Char | undefined> {
    const result = await this.parser.parseStringPromise(xmlContent);
    let char = undefined;
    try {
      char = await this.charService.createChar(result, path);
    } catch (e: any) {
      console.error(
        `Failed to parse character file at path: ${path} (Reason: ${e.message})`,
      );
    }
    if (!char) {
      console.error('Failed to create character from path:', path);
    }
    return char;
  }

  public showCredits(): void {
    void window.electron.showCredits();
  }
}
