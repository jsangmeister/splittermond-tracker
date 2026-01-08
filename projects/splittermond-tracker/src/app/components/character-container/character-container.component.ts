import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Component,
  computed,
  input,
  viewChild,
  viewChildren,
} from '@angular/core';
import { PointsTableComponent } from '../points-table/points-table.component';
import { HistoryComponent } from '../history/history.component';
import { Char } from '../../models/char';

@Component({
  selector: 'character-container',
  imports: [
    CommonModule,
    PointsTableComponent,
    HistoryComponent,
    MatTooltipModule,
  ],
  templateUrl: './character-container.component.html',
  styleUrl: './character-container.component.scss',
})
export class CharacterContainerComponent {
  protected historyComponent = viewChild.required(HistoryComponent);

  private pointsTables = viewChildren(PointsTableComponent);

  protected SHORT_REST_TOOLTIP = computed(
    () => `
Verschnaufpause (min. 30min): regeneriert alle erschöpften Fokus- und Lebenspunkte
  `,
  );

  protected LONG_REST_TOOLTIP = computed(
    () => `
Ruhepause (min. 6h):
- beendet alle kanalisierten Zauber
- regeneriert alle erschöpften Fokus- und Lebenspunkte 
- regeneriert ${this.char().lp_regeneration} (KON * ${2 + this.char().additional_lp_regeneration}) verzehrte Lebenspunkte
- regeneriert ${this.char().focus_regeneration} (WIL * ${2 + this.char().additional_focus_regeneration}) verzehrte Fokuspunkte
  `,
  );

  public char = input.required<Char>();

  public height = computed(() => {
    // body top padding + title row + margin + splinters row + margin + lp row + margin + focus row + 2 * outside margin + credits
    const height =
      20 +
      34 +
      31 +
      56 +
      10 +
      247 +
      20 +
      127 +
      (this.focusRows() * 25 - 5) +
      40 +
      34;
    return height;
  });

  public width = computed(() => {
    const leftColumnWidth = Math.max(
      288, // width of focus input field + buttons
      ...this.pointsTables().map((table) => table.width()),
    );
    // left column + middle margin + right column + 2 * outside margin + 2 * body padding
    const width = leftColumnWidth + 31 + 400 + 40 + 40;
    return width;
  });

  protected noteHeight = computed(() => this.focusRows() * 25 + 121);

  private focusRows = computed(() => Math.ceil(this.char().max_focus / 10));

  protected async reset(): Promise<void> {
    const prompt =
      'Bist du sicher, dass du alle verbrauchten Punkte zurücksetzen willst?';
    if (!(await window.electron.confirm(prompt))) {
      return;
    }
    this.char().resetUsageData();
  }

  protected longRest(): void {
    this.char().longRest();
  }

  protected shortRest(): void {
    this.char().shortRest();
  }
}
