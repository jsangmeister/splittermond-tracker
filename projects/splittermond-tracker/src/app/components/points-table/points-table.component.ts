import { CommonModule } from '@angular/common';
import { Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { Char, UsageType } from 'src/app/models/char';

@Component({
  selector: 'points-table',
  templateUrl: './points-table.component.html',
  styleUrls: ['./points-table.component.scss'],
  imports: [CommonModule],
})
export class PointsTableComponent {
  public readonly Math = Math;

  public mode = input.required<'focus' | 'lp' | 'splinters'>();

  public char = input.required<Char>();

  public error = signal<string>('');

  private input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  public getClass(i: number): UsageType | null {
    let curr = this.char()[`consumed_${this.mode()}`];
    if (i < curr) {
      return 'consumed';
    }
    curr += this.char()[`exhausted_${this.mode()}`];
    if (i < curr) {
      return 'exhausted';
    }
    curr += this.char()[`channeled_${this.mode()}`];
    if (i < curr) {
      return 'channeled';
    }
    return null;
  }

  public minus(): void {
    this.change(this.input().nativeElement.value);
  }

  public plus(): void {
    this.change(this.input().nativeElement.value, -1);
  }

  public minus_channeled(): void {
    if (this.mode() === 'splinters') {
      this.change('k1');
    }
  }

  public plus_channeled(): void {
    if (this.mode() === 'splinters') {
      this.change('k1', -1);
    }
  }

  private change(value: string, factor = 1): void {
    try {
      const obj = this.parse(value);
      const update: Partial<Char> = {};
      let total = 0;
      for (const [type, amount] of Object.entries(obj)) {
        const field = `${type as UsageType}_${this.mode()}` as const;
        const diff = Math.max(factor * amount, -this.char()[field]);
        total += diff;
        update[field] = this.char()[field] + diff;
      }
      if (total > this.char()[`free_${this.mode()}`]) {
        throw new Error(`Not enough ${this.mode()} remaining`);
      }
      Object.assign(this.char(), update);
      if (this.mode() !== 'splinters') {
        this.input().nativeElement.value = '';
      }
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  private parse(value: string): Partial<Record<UsageType, number>> {
    if (value) {
      if (this.mode() === 'lp') {
        const res = /^([bek])?(\d+)$/.exec(value.toLowerCase());
        if (res) {
          return {
            [res[1]
              ? res[1] === 'k'
                ? 'channeled'
                : 'exhausted'
              : 'consumed']: res[2],
          };
        }
      } else {
        const res = /^(?:(k)?(\d+))?(?:v(\d+))?$/.exec(value.toLowerCase());
        if (res) {
          const consumed = parseInt('0' + res[3]);
          let other = parseInt('0' + res[2]);
          if (res[2] && other < consumed) {
            throw new Error(
              'Invalid format: consumed cannot be larger than the first value',
            );
          }
          // Special case: allow "v4" as shortcut for "4v4"
          if (other === 0 && consumed > 0) {
            other = consumed;
          }
          return {
            [res[1] ? 'channeled' : 'exhausted']: other - consumed,
            consumed,
          };
        }
      }
    }
    throw new Error(`Invalid input.`);
  }
}
