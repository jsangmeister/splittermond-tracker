import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Component, computed, inject, signal } from '@angular/core';
import { Char } from './models/char';
import * as xml2js from 'xml2js';
import { CharacterService } from './services/character-service';
import { PointsTableComponent } from './components/points-table/points-table.component';
import { HistoryComponent } from './components/history/history.component';
import { HistoryService } from './services/history.service';

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
  imports: [
    CommonModule,
    PointsTableComponent,
    HistoryComponent,
    MatTooltipModule,
  ],
})
export class AppComponent {
  private charService = inject(CharacterService);
  private historyService = inject(HistoryService);

  public SHORT_REST_TOOLTIP = computed(
    () => `
Verschnaufpause (min. 30min): regeneriert alle erschöpften Fokus- und Lebenspunkte
  `,
  );

  public LONG_REST_TOOLTIP = computed(
    () => `
Ruhepause (min. 6h):
- beendet alle kanalisierten Zauber
- regeneriert alle erschöpften Fokus- und Lebenspunkte 
- regeneriert ${this.char().lp_regeneration} (KON * ${2 + this.char().additional_lp_regeneration}) verzehrte Lebenspunkte
- regeneriert ${this.char().focus_regeneration} (WIL * ${2 + this.char().additional_focus_regeneration}) verzehrte Fokuspunkte
  `,
  );

  public char = signal(new Char());

  public disableUndo = computed(() => this.historyService.current() <= 0);

  public disableRedo = computed(
    () => this.historyService.current() >= this.historyService.history().length,
  );

  public noteHeight = signal('100px');

  public constructor() {
    void this.loadCharacter(LoadCharacterMode.NeverAsk);
  }

  public async reset(): Promise<void> {
    const prompt =
      'Bist du sicher, dass du alle verbrauchten Punkte zurücksetzen willst?';
    if (!(await window.electron.confirm(prompt))) {
      return;
    }
    this.char().resetUsageData();
  }

  public longRest(): void {
    this.char().longRest();
  }

  public shortRest(): void {
    this.char().shortRest();
  }

  public undo(): void {
    this.historyService.undo();
  }

  public redo(): void {
    this.historyService.redo();
  }

  public async open(): Promise<void> {
    await this.loadCharacter(LoadCharacterMode.AlwaysAsk);
  }

  private async loadCharacter(mode = LoadCharacterMode.Default): Promise<void> {
    const xmlContent = await window.electron.loadCharacter(mode);
    if (!xmlContent) {
      return;
    }
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlContent);
    const char = await this.charService.createChar(result);
    if (!char) {
      console.error('Char could not be created');
      return;
    }
    this.char.set(char);
    const maxPerRow = Math.max(char.lp + 1, Math.min(char.max_focus, 10));
    const focusRows = Math.ceil(char.max_focus / 10);
    const width = maxPerRow * 25 + Math.floor(maxPerRow / 5) * 10 + 405;
    const height = focusRows * 25 + 635;
    window.electron.setWindowSize(width, height);
    this.noteHeight.set(focusRows * 25 + 121 + 'px');
  }

  public showCredits(): void {
    void window.electron.showCredits();
  }
}
