/* Copyright (c) 2024-2026 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import { equal } from 'node:assert'

import { sanitizeDefName } from '../dist/project/standard/CreateRoot'


describe('defname', () => {

  test('leaves conforming names untouched', () => {
    equal(sanitizeDefName('aareguru_0.1.0.json'), 'aareguru_0.1.0.json')
    equal(sanitizeDefName('gitlab-v4-swagger-2.0.yaml'), 'gitlab-v4-swagger-2.0.yaml')
    equal(sanitizeDefName('u.to-link-shortener_0.1.0.json'), 'u.to-link-shortener_0.1.0.json')
    equal(sanitizeDefName('inno_cyber-authentication_0.1.0.json'),
      'inno_cyber-authentication_0.1.0.json')
  })


  test('elides quotes so the name agrees with sanitizeSlug', () => {
    // apidef's sanitizeSlug DROPS the apostrophe to derive the repo name
    // (catherine-shulmans-quotes-sdk); folding it to '-' here would leave the
    // def file and the repo disagreeing about the same slug.
    equal(sanitizeDefName("catherine-shulman's-quotes_0.1.0.json"),
      'catherine-shulmans-quotes_0.1.0.json')
  })


  test('folds accents to ascii', () => {
    equal(sanitizeDefName('dólar-y-monedas_0.1.0.json'), 'dolar-y-monedas_0.1.0.json')
    equal(sanitizeDefName('kölner-adressen_0.1.0.json'), 'kolner-adressen_0.1.0.json')
    equal(sanitizeDefName('pokémon-tcg_0.1.0.json'), 'pokemon-tcg_0.1.0.json')
  })


  test('folds other punctuation without leaving separators dangling', () => {
    equal(sanitizeDefName('osu!-beatmap_0.1.0.json'), 'osu-beatmap_0.1.0.json')
    equal(sanitizeDefName('we->-ultrarich_0.1.0.yaml'), 'we-ultrarich_0.1.0.yaml')
    // '!' sits directly before the version separator: the fold must not leave
    // yu-gi-oh-_0.1.0.json.
    equal(sanitizeDefName('yu-gi-oh!_0.1.0.json'), 'yu-gi-oh_0.1.0.json')
  })


  test('lowercases', () => {
    equal(sanitizeDefName('UPPER-Case_0.1.0.JSON'), 'upper-case_0.1.0.json')
  })


  test('never emits a name outside [a-z0-9._-]', () => {
    const names = [
      "catherine-shulman's-quotes_0.1.0.json",
      'dólar-y-monedas_0.1.0.json',
      'we->-ultrarich_0.1.0.yaml',
      'yu-gi-oh!_0.1.0.json',
      'osu!-beatmap_0.1.0.json',
      'a b/c*d?e_0.1.0.json',
    ]
    for (const n of names) {
      equal(/^[a-z0-9._-]+$/.test(sanitizeDefName(n)), true, n)
    }
  })


  test('falls back rather than returning an empty name', () => {
    // A name that is entirely non-conforming must not collapse to '', which
    // would emit a def file with no filename.
    equal(sanitizeDefName('!!!'), 'openapi.yml')
  })

})
