export type OrderDirection = "ASC" | "DESC";
export type PrimitiveType<
  T = unknown,
  TArgs extends readonly unknown[] = unknown[],
> = { (...values: TArgs): T };
export type IObjectType<
  T = unknown,
  TArgs extends readonly unknown[] = unknown[],
> = { new (...values: TArgs): T };
export type GenericType<
  T = unknown,
  TArgs extends readonly unknown[] = unknown[],
> = PrimitiveType<T, TArgs> | IObjectType<T, TArgs>;
export type ValueType =
  | number
  | bigint
  | string
  | boolean
  | Date
  | ArrayBufferView
  | ArrayBuffer;
