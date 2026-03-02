import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CharacterContainerComponent } from './character-container.component';
import { describe, beforeEach, it, vi, expect } from 'vitest';
import { By } from '@angular/platform-browser';
import { Char } from 'src/app/models/char';
import { inputBinding } from '@angular/core';

const char = new Char();

describe('CharacterContainerComponent', () => {
  let fixture: ComponentFixture<CharacterContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterContainerComponent, {
      bindings: [inputBinding('char', () => char)],
    });
    fixture.detectChanges();
  });

  it('should update the char note when textarea content changes', () => {
    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement;
    textarea.value = 'test';
    textarea.dispatchEvent(new Event('input'));
    expect(char.note()).toBe('test');
  });
});