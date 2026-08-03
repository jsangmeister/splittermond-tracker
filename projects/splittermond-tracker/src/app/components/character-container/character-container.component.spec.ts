import { inputBinding } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Char } from 'src/app/models/char';
import { mockElectron } from 'src/test/util';
import { beforeEach, describe, expect, it } from 'vitest';

import { CharacterContainerComponent } from './character-container.component';

const char = new Char();

describe('CharacterContainerComponent', () => {
  let fixture: ComponentFixture<CharacterContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterContainerComponent],
    }).compileComponents();
    mockElectron();

    fixture = TestBed.createComponent(CharacterContainerComponent, {
      bindings: [inputBinding('char', () => char)],
    });
    fixture.detectChanges();
  });

  it('should update the char note when textarea content changes', () => {
    const textarea = fixture.debugElement.query(
      By.css('textarea'),
    ).nativeElement;
    textarea.value = 'test';
    textarea.dispatchEvent(new Event('input'));
    expect(char.note()).toBe('test');
  });
});
