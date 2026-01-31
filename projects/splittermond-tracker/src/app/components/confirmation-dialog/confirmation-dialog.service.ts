import { inject, Injectable } from '@angular/core';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  private dialog = inject(MatDialog);

  public async confirm(message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message },
      autoFocus: '#no-button',
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }
}
