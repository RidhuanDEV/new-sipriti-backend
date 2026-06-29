export interface UploadImageResponseDto {
  id: string | null;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface RichtextUploadResponseDto {
  id: string | null;
  url: string;
}
