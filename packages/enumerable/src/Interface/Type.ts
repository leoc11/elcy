import type { Enumerable } from "src/Enumerable";

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
export type Pivot<
  T,
  TD extends { [key: string]: (item: T) => unknown },
  TM extends { [key: string]: (item: Enumerable<T>) => unknown },
> = { [key in keyof TD]: ReturnType<TD[key]> } & {
  [key in keyof TM]: ReturnType<TM[key]>;
};
export type ValueType =
  | number
  | bigint
  | string
  | boolean
  | Date
  | ArrayBufferView
  | ArrayBuffer;
