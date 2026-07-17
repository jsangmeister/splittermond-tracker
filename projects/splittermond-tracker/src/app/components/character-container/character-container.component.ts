import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { MarkdownModule } from 'ngx-markdown';

import {
  Char,
  GENERAL_SKILLS,
  GENERAL_SKILLS_LABELS,
  GeneralSkillKey,
  MAGIC_SCHOOLS,
  MAGIC_SCHOOLS_LABELS,
  MagicSchoolKey,
} from '../../models/char';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { HistoryComponent } from '../history/history.component';
import { PointsTableComponent } from '../points-table/points-table.component';

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
    NzPopoverModule,
    MatDivider,
  ],
  templateUrl: './character-container.component.html',
  styleUrl: './character-container.component.scss',
  host: {
    '(document:keydown.control.z)': 'historyComponent().undo()',
    '(document:keydown.control.y)': 'historyComponent().redo()',
  },
})
export class CharacterContainerComponent {
  public char = input.required<Char>();

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

  protected visibleSkills = computed(() => {
    const magicSchools = MAGIC_SCHOOLS.filter(
      (id) => this.char()[`_${id}`]() > 0,
    ).map((id) => ({ id, label: MAGIC_SCHOOLS_LABELS[id] }));
    const result: { id?: GeneralSkillKey | MagicSchoolKey; label: string }[] = [
      { label: 'Allgemeine Fähigkeiten' },
      ...GENERAL_SKILLS.map((id) => ({ id, label: GENERAL_SKILLS_LABELS[id] })),
    ];
    if (magicSchools.length > 0) {
      result.push({ label: 'Magieschulen' }, ...magicSchools);
    }
    return result;
  });

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
- regeneriert ${this.char().lp_regeneration()} (KON * ${2 + this.char().additional_lp_regeneration()}) verzehrte Lebenspunkte
- regeneriert ${this.char().focus_regeneration()} (WIL * ${2 + this.char().additional_focus_regeneration()}) verzehrte Fokuspunkte
  `,
  );

  private confirmationService = inject(ConfirmationDialogService);

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
