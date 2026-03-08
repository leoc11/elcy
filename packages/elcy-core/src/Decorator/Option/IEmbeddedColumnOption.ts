import { IObjectType } from "../../Common/Type";

export interface IEmbeddedColumnOption {
    prefix?: string;
    type: IObjectType<any>;
}
