/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type IRCMessageTagMap = Map<string, string>;

const ESCAPE_TO_CHAR: Record<string, string> = {
  ':': ';',
  s: ' ',
  r: '\r',
  n: '\n',
  '\\': '\\',
};

const CHAR_TO_ESCAPE: Record<string, string> = {
  ';': '\\:',
  ' ': '\\s',
  '\r': '\\r',
  '\n': '\\n',
  '\\': '\\\\',
};

export function unescapeIRCv3TagValue(value: string): string {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '\\' && i + 1 < value.length) {
      const escaped = value[i + 1];
      result += ESCAPE_TO_CHAR[escaped] ?? escaped;
      i++;
    } else {
      result += char;
    }
  }
  return result;
}

export function escapeIRCv3TagValue(value: string): string {
  return value.replace(/[; \r\n\\]/g, char => CHAR_TO_ESCAPE[char] ?? char);
}

export function parseIRCv3MessageTags(tagString: string): IRCMessageTagMap {
  const tags: IRCMessageTagMap = new Map();
  tagString.split(';').forEach(rawPair => {
    if (!rawPair) return;
    const equalsIndex = rawPair.indexOf('=');
    const key =
      equalsIndex === -1 ? rawPair : rawPair.substring(0, equalsIndex);
    if (!key || tags.has(key)) return;
    const rawValue =
      equalsIndex === -1 ? '' : rawPair.substring(equalsIndex + 1);
    tags.set(key, unescapeIRCv3TagValue(rawValue));
  });
  return tags;
}

export function serializeIRCv3MessageTags(tags: IRCMessageTagMap): string {
  const serialized = Array.from(tags.entries()).map(([key, value]) =>
    value === '' ? key : `${key}=${escapeIRCv3TagValue(value)}`,
  );
  return serialized.length > 0 ? `@${serialized.join(';')}` : '';
}

export function parseIRCv3MessageLine(line: string): {
  tags: IRCMessageTagMap;
  messageLine: string;
} {
  if (!line.startsWith('@')) {
    return { tags: new Map(), messageLine: line };
  }

  const tagEnd = line.indexOf(' ');
  if (tagEnd <= 0) {
    return { tags: new Map(), messageLine: line };
  }

  return {
    tags: parseIRCv3MessageTags(line.substring(1, tagEnd)),
    messageLine: line.substring(tagEnd + 1),
  };
}

export function buildIRCv3ClientTagPrefix(
  tags: Record<string, string | undefined>,
  isAllowed: (tagName: string) => boolean = () => true,
): string {
  const tagMap: IRCMessageTagMap = new Map();
  Object.entries(tags).forEach(([key, value]) => {
    if (value === undefined || !isAllowed(key)) return;
    tagMap.set(key, value);
  });
  const serialized = serializeIRCv3MessageTags(tagMap);
  return serialized ? `${serialized} ` : '';
}
