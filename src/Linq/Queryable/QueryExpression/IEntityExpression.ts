import { IObjectType, JoinType } from "../../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { IRelationMetaData } from "../../../MetaData/Interface/index";

export interface IEntityPath {
    path: string;
    parent: IEntityExpression;
}

export interface IJoinRelationMap<TParent, TChild, TType = any> {
    parentColumn: IColumnExpression<TType, TParent>;
    childColumn: IColumnExpression<TType, TChild>;
}
export interface IJoinRelation<TParent, TChild> {
    name: string;
    child: IEntityExpression<TChild>;
    relationMaps: Array<IJoinRelationMap<TParent, TChild, any>>;
    type: JoinType;
}
export interface IEntityExpression<T = any> extends IQueryExpression<T> {
    type: IObjectType<T>;
    alias: string;
    columns: IColumnExpression[];
    name: string;
    parent?: IEntityExpression;
    primaryColumns: IColumnExpression[];
    relations: Array<IJoinRelation<T, any>>;
    clone(): IEntityExpression<T>;
    addRelation<T2>(child: IEntityExpression<T2>, relationMetaOrMap: Array<IJoinRelationMap<T, T2>> | IRelationMetaData<T, T2> | IRelationMetaData<T2, T>, name: string, type?: JoinType): IEntityExpression<T2>;
    getChildRelation<T2>(child: IEntityExpression<T2>): IJoinRelation<T, T2>;
}
