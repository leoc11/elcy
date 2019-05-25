import { PropertySelector } from "../../Common/Type";

export interface IIndexOption<TE = any> {
    name?: string;
    properties?: Array<PropertySelector<TE>>;
    unique?: boolean;
}
