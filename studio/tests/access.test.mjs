import assert from 'node:assert/strict';
import { test } from 'node:test';
import { webcrypto } from 'node:crypto';
import { createStudioHandler } from '../worker.mjs';

const now = 1_800_000_000;
const botId = '123456789';
const owner = 1234567890;
const origin = 'https://lexushop55-oss.github.io';
const encoder = new TextEncoder();
const keys = await webcrypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const ownerHash = Buffer.from(await crypto.subtle.digest('SHA-256', encoder.encode(String(owner)))).toString('hex');
const handler = createStudioHandler(keys.publicKey, () => now);
const env = { OWNER_HASH: ownerHash, BOT_ID: botId, APP_ORIGIN: origin };

async function signedData(userId = owner, authDate = now, audience = botId) {
  const form = new URLSearchParams({ query_id: 'test-session', auth_date: authDate, user: JSON.stringify({ id: userId, first_name: 'Test' }) });
  const data = [...form].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => key + '=' + value);
  const message = audience + ':WebAppData\n' + data.join('\n');
  const signature = await crypto.subtle.sign('Ed25519', keys.privateKey, encoder.encode(message));
  form.set('hash', 'unused-by-ed25519');
  form.set('signature', Buffer.from(signature).toString('base64url'));
  return form;
}

function send(form, caller = origin) {
  return handler(new Request('https://studio.example/studio', {
    method: 'POST', headers: { Origin: caller, 'Content-Type': 'text/plain' }, body: String(form)
  }), env);
}

test('returns studio scenes for the signed owner', async () => {
  const response = await send(await signedData());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal((await response.json()).scenes.length, 4);
});

test('rejects a signed guest and tampered user data', async () => {
  assert.equal((await send(await signedData(owner + 1))).status, 403);
  const changed = await signedData(owner + 1);
  changed.set('user', JSON.stringify({ id: owner }));
  assert.equal((await send(changed)).status, 403);
});

test('rejects stale, future, duplicate, unsigned and different-bot data', async () => {
  assert.equal((await send(await signedData(owner, now - 301))).status, 403);
  assert.equal((await send(await signedData(owner, now + 31))).status, 403);
  assert.equal((await send(await signedData(owner, now, '987654321'))).status, 403);
  const unsigned = await signedData();
  unsigned.delete('signature');
  assert.equal((await send(unsigned)).status, 403);
  const duplicate = await signedData();
  duplicate.append('user', duplicate.get('user'));
  assert.equal((await send(duplicate)).status, 403);
});

test('does not return data to a different origin', async () => {
  const response = await send(await signedData(), 'https://other.example');
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
});

const signingKey = Buffer.from('906e8c5ba35350d9d2202fa6e0db78eafcd440922d0782bd0bbebd99763b6bc4', 'hex');
const legacyEnv = { ...env, TELEGRAM_INIT_DATA_KEY: signingKey.toString('hex') };

async function hmacData({ id = owner, age = 0, signature } = {}) {
  const form = new URLSearchParams({ auth_date: now - age, user: JSON.stringify({ id, first_name: 'Test' }) });
  if (signature !== undefined) form.set('signature', signature);
  form.sort();
  const fields = Array.from(form, ([name, value]) => name + '=' + value).join('\n');
  const key = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(fields));
  form.set('hash', Buffer.from(mac).toString('hex'));
  return form;
}

function sendHmac(form) {
  return handler(new Request('https://studio.example/studio', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'text/plain' }, body: String(form)
  }), legacyEnv);
}

test('accepts Telegram HMAC launches with or without an Ed25519 signature', async () => {
  assert.equal((await sendHmac(await hmacData())).status, 200);
  assert.equal((await sendHmac(await hmacData({ signature: 'other-format' }))).status, 200);
});

test('HMAC still rejects guests, expired sessions and modified signed fields', async () => {
  assert.equal((await sendHmac(await hmacData({ id: owner + 1 }))).status, 403);
  assert.equal((await sendHmac(await hmacData({ age: 301 }))).status, 403);
  const tampered = await hmacData({ id: owner + 1 });
  tampered.set('user', JSON.stringify({ id: owner }));
  assert.equal((await sendHmac(tampered)).status, 403);
});
