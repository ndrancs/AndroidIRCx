/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type IRCWebSocketSubprotocol = 'binary.ircv3.net' | 'text.ircv3.net';

export interface IRCWebSocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: (() => void) | null;
  send: (data: string | ArrayBuffer | Uint8Array) => void;
  close: () => void;
  protocol?: string;
}

export function createIRCWebSocket(
  url: string,
  subprotocols: IRCWebSocketSubprotocol[] = [
    'binary.ircv3.net',
    'text.ircv3.net',
  ],
): IRCWebSocketLike {
  const WebSocketCtor = globalThis.WebSocket;
  if (!WebSocketCtor) {
    throw new Error('WebSocket transport is not available in this runtime');
  }
  return new WebSocketCtor(url, subprotocols) as unknown as IRCWebSocketLike;
}
