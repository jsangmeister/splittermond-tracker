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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, PointsTableComponent],
})
export class AppComponent {
  public char: Char;

  private charService = inject(CharacterService);

  public constructor() {
    this.char = new Char();
    void this.loadCharacter();
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
    await this.charService.saveCharacterUsage(this.char);
  }

  public async longRest(): Promise<void> {
    this.char.longRest();
    await this.charService.saveCharacterUsage(this.char);
  }

  public async shortRest(): Promise<void> {
    this.char.shortRest();
    await this.charService.saveCharacterUsage(this.char);
  }

  private async loadCharacter(): Promise<void> {
    const xmlContent = await window.electron.loadCharacter();
    if (!xmlContent) {
      return;
    }
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlContent);
    this.char.loadCharacterData(result);
    const usageData = await this.charService.loadCharacterUsage(this.char.name);
    if (usageData) {
      this.char.setUsageData(usageData);
    }
    const maxPerRow = Math.max(this.char.lp, Math.min(this.char.max_focus, 10));
    const width = maxPerRow * 25 + Math.floor(maxPerRow / 5) * 10 + 105;
    const height = Math.ceil(this.char.max_focus / 10) * 25 + 627;
    window.electron.setWindowSize(width, height);
  }

  public showCredits(): void {
    void window.electron.showCredits();
  }
}
