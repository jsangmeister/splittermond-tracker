import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { CharacterService } from 'src/app/services/character-service';

@Component({
  selector: 'app-character-selection-dialog',
  imports: [MatDialogModule, MatListModule],
  templateUrl: './character-selection-dialog.component.html',
  styleUrl: './character-selection-dialog.component.css',
})
export class CharacterSelectionDialogComponent {
  protected readonly charService = inject(CharacterService);

  protected dialogRef = inject(MatDialogRef<CharacterSelectionDialogComponent>);
}
