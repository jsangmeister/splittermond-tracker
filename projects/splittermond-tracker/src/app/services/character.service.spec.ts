import { TestBed } from '@angular/core/testing';
import { CharacterService } from './character-service';
import { Char } from '../models/char';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockElectron } from 'src/test/util';
import { Resource } from '@angular/core';

describe('CharacterService', () => {
  let service: CharacterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mockElectron();
    vi.useFakeTimers();
    service = TestBed.inject(CharacterService);
    TestBed.tick();
    vi.runAllTimersAsync();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call window.electron.storage.set when updating the note', async () => {
    console.log((service as any).allCharacters.value());
    console.log(((service as any).allCharacters as Resource<Char[]>).status());
    console.log(service.notOpenedCharacters());
    console.log(service.openedCharacters());
    service.notOpenedCharacters()[0].note.set('note');

    // Assert that the storage set method was called
    expect(window.electron.storage.set).toHaveBeenCalledWith(
      'character:test',
      expect.objectContaining({ note: 'note' })
    );
  });
});