import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PdfTextItem, SatCsfParseError } from './sat-csf.util';

interface PdfJsTextItem {
  str?: string;
  transform?: number[];
}

interface PdfJsPage {
  getTextContent(): Promise<{ items: PdfJsTextItem[] }>;
}

interface PdfJsDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
}

interface PdfJsModule {
  getDocument(params: Record<string, unknown>): {
    promise: Promise<PdfJsDocument>;
  };
  GlobalWorkerOptions?: { workerSrc: string };
}

const nodeRequire = createRequire(__filename);

export async function extractSatCsfTextItems(
  buffer: Buffer,
): Promise<PdfTextItem[]> {
  if (!buffer?.length || buffer.subarray(0, 5).toString('utf8') !== '%PDF-') {
    throw new SatCsfParseError('Sube el PDF de la constancia del SAT.');
  }

  const loaded = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as
    | PdfJsModule
    | { default: PdfJsModule };
  const pdfjs: PdfJsModule | undefined =
    typeof (loaded as PdfJsModule).getDocument === 'function' ? (loaded as PdfJsModule) : (loaded as { default: PdfJsModule }).default;
  if (!pdfjs?.getDocument) {
    throw new SatCsfParseError(
      'No se pudo abrir el PDF de la constancia del SAT.',
    );
  }

  const packageDir = path.dirname(nodeRequire.resolve('pdfjs-dist/package.json'));
  const workerPath = nodeRequire.resolve(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
  );
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  }

  const openParams = {
    disableFontFace: true,
    isEvalSupported: false,
    verbosity: 0,
    standardFontDataUrl: directoryUrl(packageDir, 'standard_fonts'),
    cMapUrl: directoryUrl(packageDir, 'cmaps'),
    cMapPacked: true,
  };

  const data = Uint8Array.from(buffer);
  let document: PdfJsDocument;
  try {
    document = await pdfjs.getDocument({ ...openParams, data }).promise;
  } catch (error) {
    if (isPasswordError(error)) {
      try {
        document = await pdfjs.getDocument({
          ...openParams,
          data: Uint8Array.from(buffer),
          password: '',
        }).promise;
      } catch (retryError) {
        throw toOpenError(retryError);
      }
    } else {
      throw toOpenError(error);
    }
  }

  const items: PdfTextItem[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      const str = item.str?.trim();
      const transform = item.transform;
      if (!str || !transform) {
        continue;
      }
      items.push({
        str,
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        page: pageNumber,
      });
    }
  }

  if (items.length === 0) {
    throw new SatCsfParseError(
      'El PDF no tiene texto. Descarga la constancia desde el SAT; una foto o un escaneo no se puede leer.',
    );
  }
  return items;
}

function isPasswordError(error: unknown): boolean {
  return error instanceof Error && error.name === 'PasswordException';
}

function toOpenError(error: unknown): SatCsfParseError {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  console.error(`SAT constancia PDF: ${name} ${message}`);
  if (name === 'PasswordException') {
    return new SatCsfParseError(
      'La constancia está protegida con contraseña. Descárgala de nuevo desde el SAT.',
    );
  }
  return new SatCsfParseError(
    'No se pudo abrir el PDF de la constancia del SAT.',
  );
}

function directoryUrl(packageDir: string, folder: string): string {
  const href = pathToFileURL(path.join(packageDir, folder)).href;
  return href.endsWith('/') ? href : `${href}/`;
}
