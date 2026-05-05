/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type {
  MessageFormatPart,
  ThemeMessageFormats,
} from '../services/ThemeService';

export const DEFAULT_MESSAGE_FORMATS: ThemeMessageFormats = {
  message: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'nick' },
    { type: 'text', value: ': ' },
    { type: 'token', value: 'message' },
  ],
  messageMention: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'nick' },
    { type: 'text', value: ': ' },
    { type: 'token', value: 'message' },
  ],
  action: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] * ' },
    { type: 'token', value: 'nick' },
    { type: 'text', value: ' ' },
    { type: 'token', value: 'message' },
  ],
  actionMention: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] * ' },
    { type: 'token', value: 'nick' },
    { type: 'text', value: ' ' },
    { type: 'token', value: 'message' },
  ],
  notice: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] -' },
    { type: 'token', value: 'nick' },
    { type: 'text', value: '- ' },
    { type: 'token', value: 'message' },
  ],
  event: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  join: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  part: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  quit: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  kick: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  nick: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'oldnick' },
    { type: 'text', value: ' -> ' },
    { type: 'token', value: 'newnick' },
  ],
  invite: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  monitor: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  mode: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  topic: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  raw: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  whois: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] [WHOIS] ' },
    { type: 'token', value: 'nick' },
    { type: 'text', value: ' ' },
    { type: 'token', value: 'message' },
  ],
  who: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] [WHO] ' },
    { type: 'token', value: 'channel' },
    { type: 'text', value: ' ' },
    { type: 'token', value: 'nick' },
    { type: 'text', value: ' ' },
    { type: 'token', value: 'userhost' },
    { type: 'text', value: ' ' },
    { type: 'token', value: 'message' },
  ],
  names: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] [NAMES] ' },
    { type: 'token', value: 'channel' },
    { type: 'text', value: ' (' },
    { type: 'token', value: 'count' },
    { type: 'text', value: ') ' },
    { type: 'token', value: 'names' },
  ],
  error: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
  ctcp: [
    { type: 'text', value: '[' },
    { type: 'token', value: 'time' },
    { type: 'text', value: '] ' },
    { type: 'token', value: 'message' },
  ],
};

export const AVAILABLE_MESSAGE_FORMAT_TOKENS: MessageFormatPart[] = [
  { type: 'token', value: 'time' },
  { type: 'token', value: 'nick' },
  { type: 'token', value: 'oldnick' },
  { type: 'token', value: 'newnick' },
  { type: 'token', value: 'message' },
  { type: 'token', value: 'channel' },
  { type: 'token', value: 'network' },
  { type: 'token', value: 'account' },
  { type: 'token', value: 'username' },
  { type: 'token', value: 'hostname' },
  { type: 'token', value: 'userhost' },
  { type: 'token', value: 'hostmask' },
  { type: 'token', value: 'server' },
  { type: 'token', value: 'target' },
  { type: 'token', value: 'mode' },
  { type: 'token', value: 'topic' },
  { type: 'token', value: 'reason' },
  { type: 'token', value: 'realname' },
  { type: 'token', value: 'channels' },
  { type: 'token', value: 'names' },
  { type: 'token', value: 'owners' },
  { type: 'token', value: 'admins' },
  { type: 'token', value: 'ops' },
  { type: 'token', value: 'halfops' },
  { type: 'token', value: 'voices' },
  { type: 'token', value: 'normal' },
  { type: 'token', value: 'count' },
  { type: 'token', value: 'idle' },
  { type: 'token', value: 'date' },
  { type: 'token', value: 'status' },
  { type: 'token', value: 'numeric' },
  { type: 'token', value: 'command' },
];

export type RawResponsePresetId = 'compact' | 'ircapLike' | 'plain';

export interface RawResponseFormatPreset {
  id: RawResponsePresetId;
  title: string;
  formats: Pick<ThemeMessageFormats, 'whois' | 'who' | 'names'>;
}

export const RAW_RESPONSE_FORMAT_PRESETS: RawResponseFormatPreset[] = [
  {
    id: 'compact',
    title: 'Compact',
    formats: {
      whois: [
        { type: 'token', value: 'time', style: { color: '#7DD3FC' } },
        { type: 'text', value: ' WHOIS ', style: { color: '#22C55E' } },
        { type: 'token', value: 'nick', style: { color: '#FACC15' } },
        { type: 'text', value: ': ', style: { color: '#94A3B8' } },
        { type: 'token', value: 'message' },
      ],
      who: [
        { type: 'token', value: 'time', style: { color: '#7DD3FC' } },
        { type: 'text', value: ' WHO ', style: { color: '#22C55E' } },
        { type: 'token', value: 'nick', style: { color: '#FACC15' } },
        { type: 'text', value: ' ', style: { color: '#94A3B8' } },
        { type: 'token', value: 'userhost', style: { color: '#A7F3D0' } },
        { type: 'text', value: ' - ', style: { color: '#94A3B8' } },
        { type: 'token', value: 'message' },
      ],
      names: [
        { type: 'token', value: 'time', style: { color: '#7DD3FC' } },
        { type: 'text', value: ' NAMES ', style: { color: '#22C55E' } },
        { type: 'token', value: 'channel', style: { color: '#FACC15' } },
        { type: 'text', value: ' ', style: { color: '#94A3B8' } },
        { type: 'token', value: 'count', style: { color: '#A7F3D0' } },
        { type: 'text', value: ': ', style: { color: '#94A3B8' } },
        { type: 'token', value: 'names' },
      ],
    },
  },
  {
    id: 'ircapLike',
    title: 'IRcap-like',
    formats: {
      whois: [
        { type: 'token', value: 'time', style: { color: '#00D000' } },
        { type: 'text', value: ' |--> ', style: { color: '#00D000' } },
        { type: 'token', value: 'nick', style: { color: '#00FF66' } },
        { type: 'text', value: ' :', style: { color: '#00D000' } },
        { type: 'token', value: 'message', style: { color: '#00D000' } },
      ],
      who: [
        { type: 'token', value: 'time', style: { color: '#00D000' } },
        { type: 'text', value: ' |--> ', style: { color: '#00D000' } },
        { type: 'token', value: 'nick', style: { color: '#00FF66' } },
        { type: 'text', value: ' [', style: { color: '#00D000' } },
        { type: 'token', value: 'userhost', style: { color: '#A7F3D0' } },
        { type: 'text', value: '] ', style: { color: '#00D000' } },
        { type: 'token', value: 'message', style: { color: '#00D000' } },
      ],
      names: [
        { type: 'token', value: 'time', style: { color: '#00D000' } },
        { type: 'text', value: ' -> Nicks on ', style: { color: '#00D000' } },
        { type: 'token', value: 'channel', style: { color: '#00FF66' } },
        { type: 'text', value: ': ', style: { color: '#00D000' } },
        { type: 'token', value: 'owners', style: { color: '#F87171' } },
        { type: 'text', value: ' ', style: { color: '#00D000' } },
        { type: 'token', value: 'admins', style: { color: '#FB923C' } },
        { type: 'text', value: ' ', style: { color: '#00D000' } },
        { type: 'token', value: 'ops', style: { color: '#FACC15' } },
        { type: 'text', value: ' ', style: { color: '#00D000' } },
        { type: 'token', value: 'halfops', style: { color: '#38BDF8' } },
        { type: 'text', value: ' ', style: { color: '#00D000' } },
        { type: 'token', value: 'voices', style: { color: '#A7F3D0' } },
        { type: 'text', value: ' ', style: { color: '#00D000' } },
        { type: 'token', value: 'normal', style: { color: '#00D000' } },
      ],
    },
  },
  {
    id: 'plain',
    title: 'Plain',
    formats: {
      whois: [
        { type: 'text', value: '[' },
        { type: 'token', value: 'time' },
        { type: 'text', value: '] ' },
        { type: 'token', value: 'message' },
      ],
      who: [
        { type: 'text', value: '[' },
        { type: 'token', value: 'time' },
        { type: 'text', value: '] ' },
        { type: 'token', value: 'message' },
      ],
      names: [
        { type: 'text', value: '[' },
        { type: 'token', value: 'time' },
        { type: 'text', value: '] ' },
        { type: 'token', value: 'message' },
      ],
    },
  },
];

export const getDefaultMessageFormats = (): ThemeMessageFormats =>
  JSON.parse(JSON.stringify(DEFAULT_MESSAGE_FORMATS));
