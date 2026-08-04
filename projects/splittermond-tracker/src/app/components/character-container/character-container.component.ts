import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  resource,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { MarkdownModule } from 'ngx-markdown';

import { StoreKey } from '../../../../../shared/store-keys';
import { TextMode } from '../../../../../shared/text-mode';
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
import { CreditsDialogComponent } from '../credits-dialog/credits-dialog.component';
import { HistoryComponent } from '../history/history.component';
import { PointsTableComponent } from '../points-table/points-table.component';

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
    '(document:keydown.control.z)': 'undo($event)',
    '(document:keydown.control.y)': 'redo($event)',
  },
})
export class CharacterContainerComponent {
  public readonly char = input.required<Char>();

  public readonly active = input.required<boolean>();

  protected readonly historyComponent = viewChild.required(HistoryComponent);

  private readonly dialog = inject(MatDialog);

  private readonly noteTextarea =
    viewChild<ElementRef<HTMLTextAreaElement>>('note');

  private readonly markdownElement = viewChild('markdownEl', {
    read: ElementRef,
  });

  private isSyncingScroll = false;

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

  protected readonly textMode = resource({
    loader: () =>
      window.electron.storage
        .get(StoreKey.LAST_TEXT_MODE)
        .then((data) => data ?? TextMode.Source),
    defaultValue: TextMode.Source,
  });

  protected readonly visibleSkills = computed(() => {
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

  protected readonly SHORT_REST_TOOLTIP = computed(
    () => `
Verschnaufpause (min. 30min): regeneriert alle erschöpften Fokus- und Lebenspunkte
  `,
  );

  protected readonly LONG_REST_TOOLTIP = computed(
    () => `
Ruhepause (min. 6h):
- beendet alle kanalisierten Zauber
- regeneriert alle erschöpften Fokus- und Lebenspunkte 
- regeneriert ${this.char().lp_regeneration()} (KON * ${2 + this.char().additional_lp_regeneration()}) verzehrte Lebenspunkte
- regeneriert ${this.char().focus_regeneration()} (WIL * ${2 + this.char().additional_focus_regeneration()}) verzehrte Fokuspunkte
  `,
  );

  private readonly confirmationService = inject(ConfirmationDialogService);

  protected async reset(): Promise<void> {
    const message =
      'Bist du sicher, dass du alle verbrauchten Punkte zurücksetzen willst?';
    const result = await this.confirmationService.confirm(message);
    if (result) {
      this.char().resetUsageData();
    }
  }

  protected undo(event: Event): void {
    if (this.active() && event.target !== this.noteTextarea()?.nativeElement) {
      this.historyComponent().undo();
    }
  }

  protected redo(event: Event): void {
    if (this.active() && event.target !== this.noteTextarea()?.nativeElement) {
      this.historyComponent().redo();
    }
  }

  protected longRest(): void {
    this.char().longRest();
  }

  protected shortRest(): void {
    this.char().shortRest();
  }

  protected showCredits(): void {
    this.dialog.open(CreditsDialogComponent);
  }

  protected onTextModeChange(value: TextMode): void {
    this.textMode.set(value);
    void window.electron.storage.set(StoreKey.LAST_TEXT_MODE, value);
  }

  protected onScroll(event: Event): void {
    if (this.isSyncingScroll) {
      return;
    }
    const source = event.target as HTMLElement;
    const textarea = this.noteTextarea()?.nativeElement;
    const markdown = this.markdownElement()?.nativeElement;
    const target = source === textarea ? markdown : textarea;
    if (!target) {
      return;
    }
    const sourceScrollable = source.scrollHeight - source.clientHeight;
    if (sourceScrollable <= 0) {
      return;
    }
    const percentage = source.scrollTop / sourceScrollable;
    const targetScrollable = target.scrollHeight - target.clientHeight;
    this.isSyncingScroll = true;
    target.scrollTop = percentage * targetScrollable;
    requestAnimationFrame(() => {
      this.isSyncingScroll = false;
    });
  }
}
