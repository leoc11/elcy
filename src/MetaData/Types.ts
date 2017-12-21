export type dateTimeKind = "utc" | "unspecified" | "custom";
export type objectType<T> = { new(value?: T): T };
export type genericType<T> = objectType<T> | ((value?: T) => T);
export enum RelationType {
    OneToOne,
    OneToMany
}
