import { ICheckConstraintMetaData } from "./Interface/ICheckConstraintMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { replaceExpression } from "../Helper/Util";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ComputedColumnExpression } from "../Queryable/QueryExpression/ComputedColumnExpression";
import { ComputedColumnMetaData } from "./ComputedColumnMetaData";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";

export class CheckConstraintMetaData<TE> implements ICheckConstraintMetaData<TE> {
    constructor(public name: string, public readonly entity: IEntityMetaData<TE, any>, definition: ((entity: TE) => boolean) | IExpression<boolean>) {
        if (definition instanceof Function) {
            this.checkFn = definition;
        }
        else {
            this._definition = definition;
        }
    }
    private checkFn: (entity: TE) => boolean;
    private _definition: IExpression<boolean> | string;
    public get definition(): IExpression<boolean> | string {
        if (!this._definition) {
            let fnExp = ExpressionBuilder.parse(this.checkFn);
            this._definition = this.toDefinitionExpression(fnExp);
            this.checkFn = null;
        }
        return this._definition;
    }
    public columns: Array<IColumnMetaData<TE>>;
    protected toDefinitionExpression(fnExp: FunctionExpression<boolean>) {
        const entityParamExp = fnExp.params[0];
        const entityExp = new EntityExpression(this.entity.type, entityParamExp.name);
        replaceExpression(fnExp.body, (exp) => {
            if (exp instanceof MemberAccessExpression && exp.objectOperand === entityParamExp) {
                const columnMeta = this.entity.columns.first(o => o.propertyName === exp.memberName);
                if (columnMeta instanceof ComputedColumnMetaData) {
                    const fnExp = columnMeta.functionExpression.clone();
                    replaceExpression(fnExp, (exp2) => exp2 === fnExp.params[0] ? entityParamExp : exp2);
                    return new ComputedColumnExpression(entityExp, fnExp.body, columnMeta.propertyName);
                }
                return new ColumnExpression(entityExp, columnMeta);
            }
            return exp;
        });
        return fnExp.body;
    }
    public getDefinitionString(queryBuilder: QueryBuilder) {
        if (typeof this.definition === "string") {
            return this.definition;
        }

        return queryBuilder.getLogicalOperandString(this.definition);
    }
}
