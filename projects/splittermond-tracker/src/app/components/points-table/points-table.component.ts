import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Char, UsageType } from 'src/app/models/char';
import { CharacterService } from 'src/app/services/character-service';

@Component({
  selector: 'points-table',
  templateUrl: './points-table.component.html',
  styleUrls: ['./points-table.component.scss'],
  imports: [CommonModule],
})
export class PointsTableComponent {
  public mode = input.required<'focus' | 'lp' | 'splinters'>();

  public char = input.required<Char>();

  public error = signal<string>('');

  private charService = inject(CharacterService);

  public getClass(i: number): string {
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
    return 'normal';
  }

  public async minus(value: string): Promise<void> {
    await this.change(value);
  }

  public async plus(value: string): Promise<void> {
    await this.change(value, -1);
  }

  public async minus_channeled(): Promise<void> {
    if (this.mode() === 'splinters') {
      await this.change('k1');
    }
  }

  public async plus_channeled(): Promise<void> {
    if (this.mode() === 'splinters') {
      await this.change('k1', -1);
    }
  }

  public min(a: number, b: number): number {
    return Math.min(a, b);
  }

  private async change(value: string, factor = 1): Promise<void> {
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
      await this.charService.saveCharacterUsage(this.char());
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  private parse(value: string): Partial<Record<UsageType, number>> {
    if (value) {
      if (this.mode() === 'lp') {
        const res = /^([be])?(\d+)$/.exec(value.toLowerCase());
        if (res) {
          return { [res[1] ? 'exhausted' : 'consumed']: res[2] };
        }
      } else {
        const res = /^(?:(k)?(\d+))?(?:v(\d+))?$/.exec(value.toLowerCase());
        if (res) {
          const consumed = parseInt('0' + res[3]);
          const other = parseInt('0' + res[2]);
          if (other > 0 && other < consumed) {
            throw new Error(
              'Invalid format: consumed cannot be larger than the first value',
            );
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
