export default class Extractor {
  private readonly htmlText: string;
  constructor(htmlText: string) {
    this.htmlText = htmlText;
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
}
