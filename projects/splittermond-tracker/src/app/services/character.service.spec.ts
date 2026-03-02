import { TestBed } from '@angular/core/testing';
import { CharacterService } from './character-service';
import { Char } from '../models/char';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockElectron } from 'src/test/util';
import {toObservable} from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { Injector } from '@angular/core';

describe('CharacterService', () => {
  let service: CharacterService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    mockElectron();
    service = TestBed.inject(CharacterService);
    // wait for the characters to be loaded
    await firstValueFrom(toObservable(service.notOpenedCharacters, { injector: TestBed.inject(Injector)}).pipe(filter(chars => chars.length > 0)));
  });

  it('should call window.electron.storage.set when updating the note', () => {
    service.notOpenedCharacters()[0].note.set('note');
    TestBed.tick(); // wait for computed signals to update

    // Assert that the storage set method was called
    expect(window.electron.storage.set).toHaveBeenCalledWith(
      'character:test',
      expect.objectContaining({ note: 'note' })
    );
  });
});