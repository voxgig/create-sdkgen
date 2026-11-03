/* Copyright (c) 2026 Richard Rodger, MIT License */

import Path from 'node:path'
import { createHash } from 'node:crypto'

import { copyMode } from './copymerge'
import type { CopyMode } from './copymerge'


// Relative to the project folder.
const SCAFFOLD_LOG = '.sdk/log/scaffold.jsonl'
const SCAFFOLD_BASE = '.sdk/log/scaffold-base'
const SCAFFOLD_CONFLICT = '.sdk/log/scaffold-conflict'
const PROJECT_MODEL = '.sdk/model/project.aontu'

const COPIES_RE = /^\s*main\s*:\s*kit\s*:\s*copies\s*:\s*['"]?(merge|overwrite)\b/m


// As @voxgig/sdkgen fingerprints its copies: CRLF and LF read the same.
function fingerprint(content: any): string {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(String(content))
  const lf = Buffer.from(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1')
  return createHash('sha256').update(lf).digest('hex').slice(0, 16)
}


function at(folder: string, rel: string): string {
  return Path.join(folder, ...rel.split('/'))
}


// `main.kit.copies`, read from the project overlay without building the model.
function scaffoldMode(fs: any, folder: string): CopyMode {
  const path = at(folder, PROJECT_MODEL)
  const text = fs.existsSync(path) ? String(fs.readFileSync(path, 'utf8')) : ''
  return copyMode(COPIES_RE.exec(text)?.[1])
}


// Replays the append-only log: each line holds what one scaffold changed.
function readScaffold(fs: any, folder: string): Record<string, string> {
  const files: Record<string, string> = {}
  const path = at(folder, SCAFFOLD_LOG)

  if (!fs.existsSync(path)) {
    return files
  }

  for (const line of String(fs.readFileSync(path, 'utf8')).split('\n')) {
    let entry: any
    try {
      entry = '' === line.trim() ? undefined : JSON.parse(line)
    }
    catch (err: any) {
      continue
    }

    for (const [rel, print] of Object.entries(entry?.files ?? {})) {
      if ('string' === typeof print) {
        files[rel] = print
      }
      else if (null === print) {
        delete files[rel]
      }
    }
  }

  return files
}


function recordScaffold(
  fs: any, folder: string, jres: any, version: string,
  manage: (rel: string) => boolean, record: Record<string, string>,
) {
  const written: string[] = [
    ...(jres?.files?.written ?? []), ...(jres?.files?.unchanged ?? []),
  ]

  const files: Record<string, string> = {}

  for (const path of written) {
    const rel = Path.relative(Path.resolve(folder), Path.resolve(path))
      .split(Path.sep).join('/')

    if ('' === rel || rel.startsWith('../') || !manage(rel) || !fs.existsSync(path)) {
      continue
    }

    const print = fingerprint(fs.readFileSync(path))
    if (print !== record[rel]) {
      files[rel] = print
    }
  }

  if (0 === Object.keys(files).length) {
    return
  }

  const sorted = Object.fromEntries(Object.keys(files).sort()
    .map((rel: string) => [rel, files[rel]]))

  const log = at(folder, SCAFFOLD_LOG)
  fs.mkdirSync(Path.dirname(log), { recursive: true })
  fs.appendFileSync(log, JSON.stringify({
    at: new Date().toISOString(), op: 'scaffold', version, files: sorted,
  }) + '\n')
}


export {
  SCAFFOLD_LOG,
  SCAFFOLD_BASE,
  SCAFFOLD_CONFLICT,
  fingerprint,
  scaffoldMode,
  readScaffold,
  recordScaffold,
}
