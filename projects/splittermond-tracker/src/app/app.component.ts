import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Char } from './models/char';
import * as xml2js from 'xml2js';
import { CharacterService } from './services/character-service';
import { PointsTableComponent } from './components/points-table/points-table.component';

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
  imports: [CommonModule, PointsTableComponent],
})
export class AppComponent {
  public char = new Char();

  private charService = inject(CharacterService);

  public constructor() {
    void this.loadCharacter(LoadCharacterMode.NeverAsk);
  }

  public async reset(): Promise<void> {
    if (
      !(await window.electron.confirm(
        'Bist du sicher, dass du alle verbrauchten Punkte zurücksetzen willst?',
      ))
    ) {
      return;
    }
    this.char.resetUsageData();
  }

  public longRest(): void {
    this.char.longRest();
  }

  public shortRest(): void {
    this.char.shortRest();
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
    this.char = char;
    const maxPerRow = Math.max(this.char.lp, Math.min(this.char.max_focus, 10));
    const width = maxPerRow * 25 + Math.floor(maxPerRow / 5) * 10 + 105;
    const height = Math.ceil(this.char.max_focus / 10) * 25 + 627;
    window.electron.setWindowSize(width, height);
  }

  public showCredits(): void {
    void window.electron.showCredits();
  }
}
