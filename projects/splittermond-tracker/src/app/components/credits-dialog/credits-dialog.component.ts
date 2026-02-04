import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-credits-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './credits-dialog.component.html',
  styleUrl: './credits-dialog.component.scss',
})
export class CreditsDialogComponent {}
