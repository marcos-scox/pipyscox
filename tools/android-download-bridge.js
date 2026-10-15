import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Printer } from '@capgo/capacitor-printer';
const PipyFolder = registerPlugin('PipyFolder');

async function toBytes(value) {
  if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
  if (typeof value === 'string') return new TextEncoder().encode(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return new Uint8Array(await new Blob([value]).arrayBuffer());
}

function encodeBase64(bytes) {
  const parts = [];
  for (let i = 0; i < bytes.length; i += 0x8000) parts.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
  return btoa(parts.join(''));
}

async function toBase64(value) {
  return encodeBase64(await toBytes(value));
}

function fsError(result, path) {
  const error = new Error(result?.wrongType ? `O item em ${path} não tem o tipo esperado.` : `Item não encontrado: ${path}`);
  error.name = result?.wrongType ? 'TypeMismatchError' : 'NotFoundError';
  return error;
}

function decodeFile(result) {
  const binary = atob(result.data || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], result.name || 'arquivo', {
    type: result.type || 'application/octet-stream',
    lastModified: Number(result.lastModified) || 0,
  });
}

function nativeDirectory(uri, name, parts = []) {
  const path = parts.join('/');
  return {
    native: true, uri, name: name || 'Pasta escolhida', kind: 'directory', parts,
    queryPermission: async () => (await PipyFolder.hasAccess({ uri })).granted ? 'granted' : 'denied',
    requestPermission: async () => (await PipyFolder.hasAccess({ uri })).granted ? 'granted' : 'denied',
    isSameEntry: async other => !!other?.native && other.uri === uri && (other.parts || []).join('/') === path,
    async getDirectoryHandle(child, options = {}) {
      const next = [...parts, child];
      const result = await PipyFolder.resolvePath({ uri, path: next.join('/'), kind: 'directory', create: !!options.create });
      if (!result.exists) throw fsError(result, next.join('/'));
      return nativeDirectory(uri, result.name || child, next);
    },
    async getFileHandle(child, options = {}) {
      const next = [...parts, child];
      const result = await PipyFolder.resolvePath({ uri, path: next.join('/'), kind: 'file', create: !!options.create });
      if (!result.exists) throw fsError(result, next.join('/'));
      return nativeFile(uri, result.name || child, next);
    },
    async *entries() {
      const result = await PipyFolder.listDirectory({ uri, path });
      for (const item of result.entries || []) {
        const next = [...parts, item.name];
        yield [item.name, item.kind === 'directory'
          ? nativeDirectory(uri, item.name, next)
          : nativeFile(uri, item.name, next)];
      }
    },
    async removeEntry(child) {
      await PipyFolder.deletePath({ uri, path: [...parts, child].join('/') });
    },
  };
}

function nativeFile(uri, name, parts) {
  const path = parts.join('/');
  return {
    native: true, uri, name, kind: 'file', parts,
    async getFile() { return decodeFile(await PipyFolder.readFile({ uri, path })); },
    async createWritable() {
      const chunks = [];
      return {
        async write(value) { chunks.push(await toBytes(value)); },
        async close() {
          const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
          const bytes = new Uint8Array(size);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
          await PipyFolder.writeFile({ uri, path, data: encodeBase64(bytes) });
        },
      };
    },
  };
}

if (Capacitor.getPlatform() === 'android') {
  document.documentElement.classList.add('android-apk');
  window.pipyscoxFolderApi = {
    async pickDirectory() {
      const picked = await PipyFolder.pickDirectory();
      return picked?.cancelled ? null : nativeDirectory(picked.uri, picked.name);
    },
    openRoot(descriptor) { return nativeDirectory(descriptor.uri, descriptor.name); },
    async hasAccess(descriptor) { return (await PipyFolder.hasAccess({ uri: descriptor.uri })).granted; },
  };
}

if (Capacitor.isNativePlatform()) {
  const browserDownload = window.downloadBlob;
  window.downloadBlob = async (blob, name) => {
    try {
      const safeName = String(name || 'pipyscox-export').replace(/[\\/:*?"<>|]/g, '_');
      const { uri } = await Filesystem.writeFile({
        path: `pipyscox/${Date.now()}-${safeName}`,
        data: await toBase64(blob),
        directory: Directory.Cache,
        recursive: true,
      });
      await Share.share({
        title: safeName,
        text: 'Arquivo exportado pelo pipyscox. Escolha onde salvar ou compartilhar.',
        url: uri,
        dialogTitle: 'Salvar ou compartilhar arquivo',
      });
    } catch (error) {
      console.error('Falha ao exportar arquivo no Android', error);
      if (typeof window.toast === 'function') {
        window.toast('Não foi possível abrir o compartilhamento do arquivo.', 'err', 5000);
      } else if (typeof browserDownload === 'function') {
        browserDownload(blob, name);
      }
    }
  };

  window.pipyscoxNativePrint = async () => {
    const content = document.querySelector('#content');
    if (!content) throw new Error('Relatório indisponível para impressão.');
    const css = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'); }
      catch { return ''; }
    }).join('\n');
    const title = document.querySelector('#content h1')?.textContent?.trim() || 'Relatório pipyscox';
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const html = `<!doctype html><html lang="pt-BR" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div class="app"><div class="main"><main id="content" class="content">${content.innerHTML}</main></div></div></body></html>`;
    await Printer.printHtml({ name: title.slice(0, 70), html });
  };
}
