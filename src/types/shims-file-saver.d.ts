declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename: string): void;
}

declare module 'xlsx' {
  const XLSX: any;
  export = XLSX;
}
