import { ICacheOption } from "./ICacheOption";

export interface ICacheItem<T = unknown> extends ICacheOption {
    data: T;
    key?: string;
}
