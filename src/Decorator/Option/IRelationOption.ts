import { IObjectType, ReferenceOption } from "../../Common/Type";

export interface IRelationOption<TSlave, TMaster> {
    slaveType?: IObjectType<TSlave>;
    masterType: IObjectType<TMaster>;
    relationMap: {[key in keyof TSlave]?: keyof TMaster};
    name?: string;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
    masterRelationProperty?: string;
}
