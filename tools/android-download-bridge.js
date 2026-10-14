import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Printer } from '@capgo/capacitor-printer';

function toBase64(blob) {
  return blob.arrayBuffer().then(buffer => {
    const bytes = new Uint8Array(buffer);
    const parts = [];
    for (let i = 0; i < bytes.length; i += 0x8000) {
      parts.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
    }
    return btoa(parts.join(''));
  });
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
