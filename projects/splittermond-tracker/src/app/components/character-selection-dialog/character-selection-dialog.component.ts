import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { CharacterService } from 'src/app/services/character-service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

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
