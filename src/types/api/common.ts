export interface ApiSuccess<TData = unknown, TMeta = undefined> {
  success: true;
  message: string;
  data?: TData;
  meta?: TMeta;
}

export interface ApiFailure<TCode extends string = string> {
  success: false;
  message: string | string[];
  error: TCode;
}
