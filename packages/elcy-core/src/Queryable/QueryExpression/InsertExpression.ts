import { Enumerable } from "@elcy/enumerable";
import { ElementType, GenericType, IObjectType, SetterObj, StringKeyOf } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Expression";
import { hashCode } from "../../Helper/Hash";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";
import { IColumnMetaData } from "src/MetaData";
import { SqlTableValueParameterExpression, TSchema } from "./SqlTableValueParameterExpression";

export class InsertExpression<TE extends object = object> implements IQueryExpression<void> {
    public get columns(): Array<IColumnExpression<TE>> {
        if (!this._columns && this.entity instanceof EntityExpression) {
            this._columns = Enumerable.from(Object.values<IColumnMetaData<TE>>(this.entity.metaData.properties))
                .except(this.entity.metaData.insertGeneratedColumns)
                .map((o) => this.entity.properties[o.propertyName])
                .toArray();
        }
        return this._columns;
    }
    public get type() {
        return undefined as GenericType<void>;
    }

    constructor(public readonly entity: IEntityExpression<TE>, public readonly values: Array<SetterObj<TE>>, columns?: Array<IColumnExpression<TE>>, returnings?: Array<IColumnExpression<TE>>) {
        if (columns) {
            this._columns = columns;
        }
        if (returnings) {
            this.returnings = returnings;
        }
    }

    public returnings: Array<IColumnExpression<TE>> = [];
    public paramExps: SqlParameterExpression[] = [];
    private _columns: Array<IColumnExpression<TE>>;

    public addSqlParameter<Tval extends object>(parameterExp: ParameterExpression<Tval[]>, parameterIndex: number, alias: string, schema?: TSchema<Tval>): SqlTableValueParameterExpression<Tval>;
    public addSqlParameter<Tval>(valueExp: IExpression<Tval>, colExp?: IColumnMetaData): SqlParameterExpression<Tval>;
    public addSqlParameter<Tval>(valueExp: IExpression<Tval> | ParameterExpression<Array<ElementType<Tval> & object>>, colExpOrParamIndex?: IColumnMetaData | number, alias?: string, schema?: TSchema<Extract<Tval, object>>): SqlParameterExpression<Tval> | SqlTableValueParameterExpression<Extract<ElementType<Tval>, object>> {
        let paramExp: SqlParameterExpression<Tval>;
        if ((valueExp.type as GenericType<ElementType<Tval>[]>) === Array) {
            paramExp = new SqlTableValueParameterExpression(valueExp as ParameterExpression<Array<ElementType<Tval> & object>>, schema as any, colExpOrParamIndex as number, alias) as unknown as SqlParameterExpression<Tval>;
        }
        else {
            paramExp = new SqlParameterExpression(valueExp as IExpression<Tval>, colExpOrParamIndex as IColumnMetaData<object, Tval>);
        }
        this.paramExps.push(paramExp);
        return paramExp;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): InsertExpression<TE> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const columns = this.columns.map((o) => resolveClone(o, replaceMap));
        const values = this.values.map((o) => {
            const item: SetterObj<TE> = {};
            for (const prop in o) {
                item[prop as StringKeyOf<TE>] = resolveClone(o[prop as StringKeyOf<TE>], replaceMap);
            }
            return item;
        });
        const returning = this.returnings.map(o => resolveClone(o, replaceMap));
        const clone = new InsertExpression(entity, values, columns, returning);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        return hashCode("INSERT", hashCode(this.entity.name, Enumerable.from(this.values).map((o) => {
            let hash = 0;
            for (const prop in o) {
                hash += hashCode(prop, o[prop as StringKeyOf<TE>].hashCode());
            }
            return hash;
        }).sum()));
    }
    public toString(): string {
        return `Insert(${this.entity.toString()})`;
    }
}
