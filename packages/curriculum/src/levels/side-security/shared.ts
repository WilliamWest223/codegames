import type { LangCode } from '@codegames/shared';
import { code } from '../../helpers';

/**
 * Side quest: Security (region 10). Spec: docs/specs/region5-and-security.md Part B.
 *
 * Safety rules (B1): defense first; everything targets this fictional ship only; every toy
 * hash or cipher says NOT real security and names the real tool. Region 1–3 skills only:
 * accounts are `name:fingerprint` strings, not dictionaries.
 */

/** Join code blocks per language, one blank line apart. */
export function compose(...parts: LangCode[]): LangCode {
  const join = (lang: 'python' | 'javascript') => parts.map((p) => (p[lang] ?? '').trimEnd()).join('\n\n') + '\n';
  return { python: join('python'), javascript: join('javascript') };
}

export const TOY_HASH = code(
  `
  def toy_hash(text):
      # A TOY hash for learning. NOT real security: real systems use bcrypt, scrypt or Argon2.
      total = 0
      for ch in text:
          total = (total * 31 + ord(ch)) % 1000003
      return total
  `,
  `
  function toyHash(text) {
    // A TOY hash for learning. NOT real security: real systems use bcrypt, scrypt or Argon2.
    let total = 0;
    for (const ch of text) {
      total = (total * 31 + ch.charCodeAt(0)) % 1000003;
    }
    return total;
  }
  `,
);

export const CAESAR = code(
  `
  def caesar(text, key):
      result = ""
      for ch in text:
          if ch >= "a" and ch <= "z":
              position = (ord(ch) - ord("a") + key) % 26
              result += chr(ord("a") + position)
          else:
              result += ch
      return result
  `,
  `
  function caesar(text, key) {
    let result = "";
    for (const ch of text) {
      if (ch >= "a" && ch <= "z") {
        const position = (((ch.charCodeAt(0) - 97 + key) % 26) + 26) % 26;
        result += String.fromCharCode(97 + position);
      } else {
        result += ch;
      }
    }
    return result;
  }
  `,
);

export const VALID_USERNAME = code(
  `
  def valid_username(name):
      if len(name) < 3:
          return "Too short"
      if len(name) > 12:
          return "Too long"
      if not (name[0] >= "a" and name[0] <= "z"):
          return "Must start with a letter"
      for ch in name:
          if ch not in "abcdefghijklmnopqrstuvwxyz0123456789_":
              return "Only a-z, 0-9 and _"
      return "OK"
  `,
  `
  function validUsername(name) {
    if (name.length < 3) {
      return "Too short";
    }
    if (name.length > 12) {
      return "Too long";
    }
    if (!(name[0] >= "a" && name[0] <= "z")) {
      return "Must start with a letter";
    }
    for (const ch of name) {
      if (!"abcdefghijklmnopqrstuvwxyz0123456789_".includes(ch)) {
        return "Only a-z, 0-9 and _";
      }
    }
    return "OK";
  }
  `,
);
