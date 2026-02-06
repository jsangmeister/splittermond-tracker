import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CharacterService } from 'src/app/services/character-service';

@Component({
  selector: 'app-character-selection-dialog',
  imports: [
    MatDialogModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './character-selection-dialog.component.html',
  styleUrl: './character-selection-dialog.component.scss',
})
export class CharacterSelectionDialogComponent {
  protected readonly charService = inject(CharacterService);

  protected dialogRef = inject(MatDialogRef<CharacterSelectionDialogComponent>);

  protected async changeBaseFolder(): Promise<void> {
    await window.electron.changeBaseFolder();
    this.charService.reloadCharacters();
  }
}
