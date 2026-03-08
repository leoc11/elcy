export type OrderDirection = "ASC" | "DESC";
export type IObjectType<T = unknown> = { new(...values: unknown[]): T; };
export type GenericType<T = unknown> = { (...values: unknown[]): T; } | IObjectType<T>;
export type Pivot<T,
    TD extends { [key: string]: (item: T) => unknown },
    TM extends { [key: string]: (item: T[]) => unknown }>
    = { [key in keyof TD]: ReturnType<TD[key]> } & { [key in keyof TM]: ReturnType<TM[key]> };