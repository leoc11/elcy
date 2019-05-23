import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { replaceExpression } from "../Helper/Util";
import { RelationQueryBuilder } from "../Provider/Relation/RelationQueryBuilder";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
import { ComputedColumnExpression } from "../Queryable/QueryExpression/ComputedColumnExpression";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { ComputedColumnMetaData } from "./ComputedColumnMetaData";
import { ICheckConstraintMetaData } from "./Interface/ICheckConstraintMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class CheckConstraintMetaData<TE> implements ICheckConstraintMetaData<TE> {
    public get definition(): IExpression<boolean> | string {
        if (!this._definition) {
            const fnExp = ExpressionBuilder.parse(this.checkFn, [this.entity.type]);
            this._definition = this.toDefinitionExpression(fnExp);
            this.checkFn = null;
        }
        return this._definition;
    }
    public columns: Array<IColumnMetaData<TE>>;
    private checkFn: (entity: TE) => boolean;
    private _definition: IExpression<boolean> | string;
    constructor(public name: string, public readonly entity: IEntityMetaData<TE, any>, definition: ((entity: TE) => boolean) | IExpression<boolean>) {
        if (definition instanceof Function) {
            this.checkFn = definition;
        }
        else {
            this._definition = definition;
        }
    }
    public getDefinitionString(queryBuilder: RelationQueryBuilder) {
        if (typeof this.definition === "string") {
            return this.definition;
        }

        return queryBuilder.toLogicalString(this.definition);
    }
    protected toDefinitionExpression(fnExp: FunctionExpression<boolean>) {
        const entityParamExp = fnExp.params[0];
        const entityExp = new EntityExpression(this.entity.type, entityParamExp.name);
        replaceExpression(fnExp.body, (exp) => {
            if (exp instanceof MemberAccessExpression && exp.objectOperand === entityParamExp) {
                const columnMeta = this.entity.columns.first((o) => o.propertyName === exp.memberName);
                if (columnMeta instanceof ComputedColumnMetaData) {
                    const fnExpClone = columnMeta.functionExpression.clone();
                    replaceExpression(fnExpClone, (exp2) => exp2 === fnExpClone.params[0] ? entityParamExp : exp2);
                    return new ComputedColumnExpression(entityExp, fnExpClone.body, columnMeta.propertyName);
                }
                return new ColumnExpression(entityExp, columnMeta);
            }
            return exp;
        });
        return fnExp.body;
    }
}
