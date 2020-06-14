import { JoinType } from "../../Common/StringType";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { isColumnExp, resolveClone, visitExpression } from "../../Helper/Util";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";
import { ISelectRelation } from "./ISelectRelation";

export class JoinRelation<T = any, TChild = any> implements ISelectRelation<T, TChild> {
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
    constructor(parent: SelectExpression<T>, child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType);
    constructor(parent?: SelectExpression<T>, child?: SelectExpression<TChild>, relations?: IExpression<boolean>, type?: JoinType) {
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
    public parent: SelectExpression<T>;
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
                    const colExp = exp as IColumnExpression;
                    if (this.child.entity === colExp.entity) {
                        this._childColumns.push(colExp);
                    }
                    else if (this.parent.entity === colExp.entity) {
                        this._parentColumns.push(colExp);
                    }
                    else if (this.child.allSelects.select((o) => o.entity).contains(colExp.entity)) {
                        this._childColumns.push(colExp);
                    }
                    else if (this.parent.allSelects.select((o) => o.entity).contains(colExp.entity)) {
                        this._parentColumns.push(colExp);
                    }
                }
                else if (!(exp instanceof AndExpression || exp instanceof EqualExpression || exp instanceof StrictEqualExpression)) {
                    this._isManyManyRelation = true;
                }
            });

            if (!this._isManyManyRelation) {
                const childPks = this.child.allSelects.selectMany((o) => o.primaryKeys);
                const parentPks = this.parent.allSelects.selectMany((o) => o.primaryKeys);
                childPks.enableCache = parentPks.enableCache = true;
                this._isManyManyRelation = this._childColumns.any((o) => !childPks.contains(o)) && this._parentColumns.any((o) => !parentPks.contains(o));
            }
        }
    }
    //#endregion
}
