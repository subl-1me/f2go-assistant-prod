import NotesByUser from './models/NotesByUser';
import VCCProvidersPatterns from './models/VCCProvidersPatterns';
import { VirtualCreditCard } from './models/VirtualCreditCard';
import { VCC_PROVIDERS_PATTERN_LIST } from './Patterns';

export default class Extractor {
  private readonly htmlText: string;
  constructor(htmlText?: string) {
    this.htmlText = htmlText || '';
  }

  public extractRequestVerificationToken(): string {
    const tokenRegex =
      /name="__RequestVerificationToken" type="hidden" value="([^"]+)"/;
    const match = this.htmlText.match(tokenRegex);
    if (match && match[1]) {
      return match[1];
    }
    return '';
  }

  public extractVirtualCardData(notesByUser: NotesByUser): any {
    const providers = Object.keys(VCC_PROVIDERS_PATTERN_LIST);
    let data = {
      provider: '',
      amountToCharge: 0,
      isValid: false,
    };

    // match use_declaration
    providers.forEach((provider) => {
      const { notes } = notesByUser;
      if (
        notes.find((note) =>
          note.match(
            VCC_PROVIDERS_PATTERN_LIST[provider as keyof VCCProvidersPatterns]
              .USE_DECLARATION
          )
        )
      ) {
        const concatenatedNotes = notes.reduce((accum, current) => {
          return current + ' ' + accum;
        }, '');

        const chargeDeclarationMatch = concatenatedNotes.match(
          VCC_PROVIDERS_PATTERN_LIST[provider as keyof VCCProvidersPatterns]
            .AMOUNT_TO_CHARGE_DECLARATION
        );

        if (chargeDeclarationMatch) {
          const amountToChargeMatch = concatenatedNotes.match(
            VCC_PROVIDERS_PATTERN_LIST[provider as keyof VCCProvidersPatterns]
              .AMOUNT
          );
          data.provider = provider;
          data.amountToCharge = amountToChargeMatch
            ? Number(amountToChargeMatch[0])
            : 0;
          data.isValid = true;
        }
      }
    });

    return data;
  }

  public extractBonvoyCertificateId(text: string): string | null {
    let certificate = null;
    const certificateElementPattern = new RegExp(
      `<label id="sCertificated"([\\s\\S\\t.]*?)>(.*)<\/label>`
    );

    const certificateMatch = text.match(certificateElementPattern);
    if (certificateMatch) {
      let elemResult = certificateMatch[0].match(/\d+/);
      certificate = elemResult ? elemResult[0] : null;
    }

    return certificate;
  }

  public extractAttachedDocsData(text: string): any {
    const validItems = [
      'Cupón agencia de viajes',
      'Carta garantía, cargo a tarjeta de crédito',
      'Carta garantía de empresa',
    ];

    const tableDataPattern =
      /<tr class="datosTabla">([\s\S\t.]*?)<\/tr>|<tr class="datosTablaAlter">([\s\S\t.]*?)<\/tr>/g;
    const dataTables = text.match(tableDataPattern);
    if (!dataTables) {
      return [];
    }

    let docs: any[] = [];
    dataTables.forEach((table) => {
      const type = validItems.filter((item) => table.includes(item)).shift();
      const docIdPattern = /fjsOpenDoc\('\d+'\)/;
      const docIdMatch = table.match(docIdPattern);
      if (docIdMatch) {
        const id = (docIdMatch[0].match(/\d+/) || [null])[0];
        docs.push({
          id,
          type,
        });
      }
    });

    return docs;
  }
}
