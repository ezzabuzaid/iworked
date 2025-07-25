export type JsonValue = {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | unknown
    | (string | number | boolean | null | unknown)[];
};
