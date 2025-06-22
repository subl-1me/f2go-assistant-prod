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
        // match amount to charge

        const concatenatedNotes = notes.reduce((accum, current) => {
          return current + ' ' + accum;
        }, '');

        console.log(concatenatedNotes);
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
}
