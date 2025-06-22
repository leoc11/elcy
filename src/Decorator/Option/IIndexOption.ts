import { PropertySelector } from "../../Common/Type";

export interface IIndexOption<TE = any> {
    name?: string;
    keys?: Array<PropertySelector<TE>>;
    includes?: Array<PropertySelector<TE>>;
    unique?: boolean;
}
