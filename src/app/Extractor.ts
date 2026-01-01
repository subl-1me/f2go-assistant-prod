import { GENERIC_FISCAL_RECEPTOR } from './const';
import Invoice from './models/Invoice';
import NotesByUser from './models/NotesByUser';
import VCCProvidersPatterns from './models/VCCProvidersPatterns';
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

  public extractRateCode(text: string): string {
    let rateCode = '';
    const rateCodePattern = /var rate_code = "(.*)";/;
    const rateCodeMatch = text.match(rateCodePattern);
    if (rateCodeMatch) {
      rateCode = rateCodeMatch[1];
    }
    return rateCode;
  }

  public extractReservationRouting(text: string): Invoice[] {
    const getRoutingPattern = new RegExp(`\\bitemArray\\s*=\\s*"(.*?)"`);
    const match = text.match(getRoutingPattern);
    if (!match) {
      return [];
    }
    const itemArrayParsed = match[1].replace(/\\u0022/g, `"`);
    const routings = JSON.parse(itemArrayParsed);
    return routings;
  }

  extractInvoices(text: string): any {
    const invoicesRowPattern =
      /<div class="row rowFacturas esquinas"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gm;
    const invoicesRowsMatch = text.match(invoicesRowPattern);
    if (!invoicesRowsMatch) {
      return [];
    }

    if (invoicesRowsMatch.length === 0) {
      return [];
    }

    // scrap for each invoices row
    const reservationIdPattern = /\d{8}\.\d{1}/;
    const rfcPattern =
      /[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{1}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{2}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{1}\d{2}|[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{2}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{3}/;
    const rfcFiscalNamePattern =
      /<label ID="lblcomprobante_emisor">(.*?)<\/label>/;

    let invoices: Invoice[] = [];
    invoicesRowsMatch.forEach((row) => {
      let invoice: Invoice = {
        ledgerNo: 1,
        fiscalCode: '',
        fiscalName: '',
        status: '',
        isGeneric: false,
      };

      const reservationIdMatch = row.match(reservationIdPattern);
      if (reservationIdMatch) {
        const reservationIdSegments = reservationIdMatch[0].split('.');
        invoice.ledgerNo = Number(reservationIdSegments[1]);
      }

      const rfcMatch = row.match(rfcPattern);
      if (rfcMatch) {
        invoice.fiscalCode = rfcMatch[0];
      }

      const fiscalNameMatch = row.match(rfcFiscalNamePattern);
      if (fiscalNameMatch) {
        invoice.fiscalName = fiscalNameMatch[1];
      }

      const invoiceStatusMatch = row.match(/Timbrado|PreFactura/);
      if (invoiceStatusMatch) {
        invoice.status = invoiceStatusMatch[0];
      }

      invoice.isGeneric =
        invoice.fiscalName.includes(GENERIC_FISCAL_RECEPTOR.receptorNombre) &&
        invoice.fiscalCode === GENERIC_FISCAL_RECEPTOR.receptorRfc;
      invoices.push(invoice);
    });

    return invoices;
  }
}
