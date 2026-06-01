/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * PendingReplyStore.ts
 *
 * Module-level store for pending IRCv3 reply context.
 * Set by MessageArea when user taps Reply, consumed by send path.
 */

export interface PendingReply {
  msgid: string;
  target: string;
  nick: string;
}

let pendingReply: PendingReply | null = null;

export function setPendingReply(reply: PendingReply | null): void {
  pendingReply = reply;
}

export function getPendingReply(): PendingReply | null {
  return pendingReply;
}

export function getAndClearPendingReply(): PendingReply | null {
  const reply = pendingReply;
  pendingReply = null;
  return reply;
}
