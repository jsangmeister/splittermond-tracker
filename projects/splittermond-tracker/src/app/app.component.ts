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
import { CharacterService } from './services/character-service';
import { CharacterContainerComponent } from './components/character-container/character-container.component';
import { MatDialog } from '@angular/material/dialog';
import { CreditsDialogComponent } from './components/credits-dialog/credits-dialog.component';
import { StoreKey, StoreValueTypes } from '../../../shared/store-keys';
import { CharacterSelectionDialogComponent } from './components/character-selection-dialog/character-selection-dialog.component';
import { firstValueFrom } from 'rxjs';

declare global {
  interface Window {
    electron: {
      getCharacters(): Promise<{ path: string; content: string }[]>;
      storage: {
        get<K extends StoreKey>(key: K): Promise<StoreValueTypes[K]>;
        get(key: string): Promise<unknown>;
        set(key: string, data: unknown): Promise<void>;
      };
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
  protected selectedIndex = signal(0);

  protected readonly charService = inject(CharacterService);

  private readonly dialog = inject(MatDialog);

  public ngOnInit(): void {
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

  public close(char: Char): void {
    this.charService.closeCharacter(char);
  }

  public async open(): Promise<void> {
    const dialogRef = this.dialog.open(CharacterSelectionDialogComponent);
    const char = await firstValueFrom(dialogRef.afterClosed());
    if (char) {
      this.charService.openedCharacters.update((chars) => chars.concat(char));
      this.selectedIndex.set(this.charService.openedCharacters().length - 1);
    }
  }

  public nextTab(): void {
    this.changeTab(1);
  }

  public previousTab(): void {
    this.changeTab(-1);
  }

  private changeTab(offset: number): void {
    const openedCount = this.charService.openedCharacters().length;
    if (openedCount) {
      const newIndex =
        (this.selectedIndex() + offset + openedCount) % openedCount;
      this.selectedIndex.set(newIndex);
    }
  }

  public showCredits(): void {
    this.dialog.open(CreditsDialogComponent);
  }
}
