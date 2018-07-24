import { IConnectionOption } from "../../Data/Interface/IConnectionOption";
export interface ISqliteConnectionOption extends IConnectionOption {
    readonly mode?: "OPEN_READONLY" | "OPEN_READWRITE" | "OPEN_CREATE";
}
