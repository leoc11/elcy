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

export class CheckConstraintMetaData<TE> implements ICheckConstraintMetaData<TE> {
    constructor(public name: string, public readonly entity: IEntityMetaData<TE, any>, private checkFn: (entity: TE) => boolean) { }
    private _definition: IExpression<boolean>;
    public get definition(): IExpression<boolean> {
        if (!this._definition) {
            const fnExp = ExpressionBuilder.parse(this.checkFn);
            this._definition = this.toDefinitionExpression(fnExp);
            this.checkFn = null;
        }
        return this._definition;
    }
    public columns: Array<IColumnMetaData<TE>>;
    protected toDefinitionExpression(fnExp: FunctionExpression) {
        const entityParamExp = fnExp.params[0];
        replaceExpression(fnExp.body, (exp) => {
            if (exp instanceof MemberAccessExpression && exp.objectOperand === entityParamExp) {
                const computedColumn = this.entity.computedProperties.first(o => o.propertyName === exp.memberName);
                if (computedColumn) {
                    return this.toDefinitionExpression(computedColumn.functionExpression);
                }
                return new ComputedColumnExpression(null, exp, exp.memberName);
            }
            return exp;
        });
        return fnExp.body;
    }
    public getDefinitionString(queryBuilder: QueryBuilder) {
        if (typeof this.definition === "string") {
            return this.definition;
        }
        return queryBuilder.getOperandString(this.definition);
    }
}
