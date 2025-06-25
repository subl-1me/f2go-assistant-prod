export default interface AttachedDocuments {
  id: string;
  type: string;
  downloadUrl: string;
  sourceId?: string;
  filePath?: string;
  hierarchy?: number;
  validation?: any;
}
