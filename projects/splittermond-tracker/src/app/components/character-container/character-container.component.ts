import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { PointsTableComponent } from '../points-table/points-table.component';
import { HistoryComponent } from '../history/history.component';
import { Char } from '../../models/char';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';

enum TextMode {
  Source = 'source',
  Both = 'both',
  Markdown = 'markdown',
}

@Component({
  selector: 'character-container',
  imports: [
    PointsTableComponent,
    HistoryComponent,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    FormsModule,
    MarkdownModule,
  ],
  templateUrl: './character-container.component.html',
  styleUrl: './character-container.component.scss',
})
export class CharacterContainerComponent {
  protected historyComponent = viewChild.required(HistoryComponent);

  protected readonly TEXT_MODES = [
    {
      value: TextMode.Source,
      icon: 'edit',
    },
    {
      value: TextMode.Both,
      icon: 'vertical_split',
    },
    {
      value: TextMode.Markdown,
      icon: 'visibility',
    },
  ];

  protected textMode = signal(TextMode.Source);

  private confirmationService = inject(ConfirmationDialogService);

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

  protected async reset(): Promise<void> {
    const message =
      'Bist du sicher, dass du alle verbrauchten Punkte zurücksetzen willst?';
    const result = await this.confirmationService.confirm(message);
    if (result) {
      this.char().resetUsageData();
    }
  }

  protected longRest(): void {
    this.char().longRest();
  }

  protected shortRest(): void {
    this.char().shortRest();
  }
}
