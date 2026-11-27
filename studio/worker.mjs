import { scenes } from './scenes.mjs';

const productionKey = 'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d';
const encoder = new TextEncoder();
const fromHex = (value) => Uint8Array.from(value.match(/.{2}/g), (byte) => parseInt(byte, 16));
const toHex = (value) => Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, '0')).join('');
const maxBodyBytes = 8192;

async function isOwner(raw, env, verifyKey, timestamp) {
  const params = new URLSearchParams(raw);
  if (new Set(params.keys()).size !== params.size) return false;
  const signature = params.get('signature');
  const authDate = Number(params.get('auth_date'));
  if (!signature || !/^[A-Za-z0-9_-]{86}={0,2}$/.test(signature)) return false;
  if (!Number.isSafeInteger(authDate) || authDate < timestamp - 300 || authDate > timestamp + 30) return false;
  params.delete('signature');
  params.delete('hash');
  params.sort();
  const fields = Array.from(params, ([key, value]) => key + '=' + value).join('\n');
  const message = env.BOT_ID + ':WebAppData\n' + fields;
  const bytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
  if (!await crypto.subtle.verify('Ed25519', verifyKey, bytes, encoder.encode(message))) return false;
  const user = JSON.parse(params.get('user') || 'null');
  if (!user || !Number.isSafeInteger(user.id)) return false;
  const hashedId = await crypto.subtle.digest('SHA-256', encoder.encode(String(user.id)));
  return toHex(hashedId) === env.OWNER_HASH;
}

async function readBody(request) {
  if (!request.body || Number(request.headers.get('Content-Length')) > maxBodyBytes) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return text + decoder.decode();
    size += value.byteLength;
    if (size > maxBodyBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

export function createStudioHandler(publicKey, nowSeconds = () => Math.floor(Date.now() / 1000)) {
  return async (request, env) => {
    const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
    const reply = (status, body) => Response.json(body, { status, headers });
    if (new URL(request.url).pathname !== '/studio') return reply(404, { error: 'Not found' });
    if (request.headers.get('Origin') !== env.APP_ORIGIN) return reply(403, { error: 'Access denied' });
    headers['Access-Control-Allow-Origin'] = env.APP_ORIGIN;
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });

    try {
      const raw = await readBody(request);
      if (raw && await isOwner(raw, env, await publicKey, nowSeconds())) return reply(200, { scenes });
    } catch {
      // Invalid launch data must never grant studio access.
    }
    return reply(403, { error: 'Access denied' });
  };
}

let handleStudio;
export default {
  fetch(request, env) {
    handleStudio ??= createStudioHandler(crypto.subtle.importKey('raw', fromHex(productionKey), 'Ed25519', false, ['verify']));
    return handleStudio(request, env);
  }
};
