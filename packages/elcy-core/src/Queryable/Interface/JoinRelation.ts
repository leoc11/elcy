import { JoinType } from "../../Common/StringType";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { isColumnExp, resolveClone, visitExpression } from "../../Helper/Util";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { IEntityExpression } from "../QueryExpression/IEntityExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";
import { ISelectRelation } from "./ISelectRelation";

export class JoinRelation<TE extends object = object, TChild extends object = object> implements ISelectRelation<TE, TChild> {
    public get childColumns() {
        if (!this._childColumns) {
            this.analyzeRelation();
        }
        return this._childColumns;
    }
    public get isManyToManyRelation() {
        if (typeof this._isManyManyRelation !== "boolean") {
            this.analyzeRelation();
        }
        return this._isManyManyRelation;
    }
    public get parentColumns() {
        if (!this._parentColumns) {
            this.analyzeRelation();
        }
        return this._parentColumns;
    }
    public get relation() {
        return this._relations;
    }
    public set relation(value) {
        this._relations = value;
        this._childColumns = this._parentColumns = this._isManyManyRelation = null;
    }
    constructor();
    constructor(parent: SelectExpression<TE, any>, child: SelectExpression<TChild, any>, relations: IExpression<boolean>, type: JoinType);
    constructor(parent?: SelectExpression<TE, any>, child?: SelectExpression<TChild, any>, relations?: IExpression<boolean>, type?: JoinType) {
        if (parent) {
            this.parent = parent;
            this.child = child;
            this.relation = relations;
            this.type = type;
        }
    }
    public child: SelectExpression<TChild>;
    public isEmbedded: boolean;
    //#endregion

    //#region Properties
    public parent: SelectExpression<TE>;
    public type: JoinType;
    private _childColumns: IColumnExpression[];
    private _isManyManyRelation: boolean;

    private _parentColumns: IColumnExpression[];
    private _relations: IExpression<boolean>;
    //#endregion

    //#region Methods
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = this.relation ? resolveClone(this.relation, replaceMap) : null;
        const clone = new JoinRelation(parent, child, relation, this.type);
        if (child !== this.child) {
            child.parentRelation = clone;
        }
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        if (this.relation) {
            visitExpression(this.relation, (exp: IExpression) => {
                if (isColumnExp(exp)) {
                    if (this.child.entity === exp.entity as unknown as IEntityExpression<TChild>) {
                        this._childColumns.push(exp);
                    }
                    else if (this.parent.entity === exp.entity as unknown as IEntityExpression<TE>) {
                        this._parentColumns.push(exp);
                    }
                    else if (this.child.allSelects.map((o) => o.entity).includes(exp.entity)) {
                        this._childColumns.push(exp);
                    }
                    else if (this.parent.allSelects.map((o) => o.entity).includes(exp.entity)) {
                        this._parentColumns.push(exp);
                    }
                }
                else if (!(exp instanceof AndExpression || exp instanceof EqualExpression || exp instanceof StrictEqualExpression)) {
                    this._isManyManyRelation = true;
                }
            });

            if (!this._isManyManyRelation) {
                const childPks = this.child.allSelects.flatMap((o) => o.primaryKeys);
                const parentPks = this.parent.allSelects.flatMap((o) => o.primaryKeys);
                this._isManyManyRelation = this._childColumns.some((o) => !childPks.includes(o)) && this._parentColumns.some((o) => !parentPks.includes(o));
            }
        }
    }
    //#endregion
}
