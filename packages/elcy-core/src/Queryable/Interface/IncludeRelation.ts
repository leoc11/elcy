import { RelationshipType } from "../../Common/StringType";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { isColumnExp } from "../../Helper/Util";
import { visitExpression } from "src/Helper/Expression";
import { resolveClone } from "src/Helper/Expression";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";
import { ISelectRelation } from "./ISelectRelation";
import { Enumerable } from "@elcy/enumerable";

export class IncludeRelation<TE extends object = any, TChild extends object = any> implements ISelectRelation<TE, TChild> {
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
    constructor();
    constructor(parent: SelectExpression<TE, any>, child: SelectExpression<TChild, any>, name: string, type: RelationshipType, relations?: IExpression<boolean>);
    constructor(parent?: SelectExpression<TE, any>, child?: SelectExpression<TChild, any>, name?: string, type?: RelationshipType, relations?: IExpression<boolean>) {
        if (parent) {
            this.parent = parent;
            this.child = child;
            this.relation = relations;
            this.type = type;
            this.name = name;
        }
    }
    public child: SelectExpression<TChild>;
    public isEmbedded: boolean;
    public name: string;
    //#endregion

    //#region Properties
    public parent: SelectExpression<TE>;
    public relation: IExpression<boolean>;
    public type: RelationshipType;
    private _childColumns: IColumnExpression[];
    private _isManyManyRelation: boolean;

    private _parentColumns: IColumnExpression[];
    //#endregion

    //#region Methods
    public addRelation(parentColumn: IColumnExpression, childColumn: IColumnExpression) {
        const logicalExp = new StrictEqualExpression(parentColumn, childColumn);
        if (this.relation instanceof AndExpression) {
            this.relation.operands.push(logicalExp);
            return;
        }
        
        this.relation = this.relation ? new AndExpression(this.relation, logicalExp) : logicalExp;
    }
    public clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new IncludeRelation(parent, child, this.name, this.type, relation);
        if (child !== this.child) {
            child.parentRelation = clone;
        }
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    public relationMap() {
        if (this.isEmbedded) {
            return Enumerable.from(this.parent.primaryKeys).map(o => [o, o]);
        }

        return Enumerable.range(0, this.parentColumns.length - 1).map(o => [this.parentColumns[o], this.childColumns[o]]);
    }

    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        this._isManyManyRelation = false;
        visitExpression(this.relation, (exp: IExpression) => {
            if (isColumnExp(exp)) {
                if (this.child.entity === exp.entity) {
                    this._childColumns.push(exp);
                }
                else if (this.parent.entity === exp.entity) {
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
    //#endregion
}
