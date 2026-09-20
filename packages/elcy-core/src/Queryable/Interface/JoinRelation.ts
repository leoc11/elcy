import type { JoinType } from "../../Common/StringType";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { isColumnExp, isExpression } from "../../Helper/Util";
import { visitExpression, resolveClone } from "../../Helper/Expression";
import type { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { IEntityExpression } from "../QueryExpression/IEntityExpression";
import { EmbeddedRelationMetaData, IBaseRelationMetaData, RelationMetaData } from "src/MetaData";
import { ValueType } from "src/Common/Type";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";

export class JoinRelation<TE = any, TChild = any> {
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

    constructor(parent: IEntityExpression<TE>, child: IEntityExpression<TChild>, relationMeta: IBaseRelationMetaData<TE, TChild>);
    constructor(parent: IEntityExpression<TE>, child: IEntityExpression<TChild>, relationExp: IExpression<boolean>, type: JoinType);
    constructor(parent: IEntityExpression<TE>, child: IEntityExpression<TChild>, relMetaOrRelExp?: IBaseRelationMetaData<TE, TChild> | IExpression<boolean>, type?: JoinType) {
        this.parent = parent;
        this.child = child;

        let relationExp: IExpression<boolean>;
        if (isExpression(relMetaOrRelExp)) {
            relationExp = relMetaOrRelExp;
        }
        if (relMetaOrRelExp instanceof EmbeddedRelationMetaData) {
            type = "INNER";
            relationExp = new ValueExpression(true);
            this.isEmbedded = true;
        }
        else if (relMetaOrRelExp instanceof RelationMetaData) {
            const relationMeta = relMetaOrRelExp;
            if (relationMeta.completeRelationType === "many-many") {
                throw new Error("many-many relation not supported");
            }

            const andExp = new AndExpression();
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = parent.properties[parentColMeta.propertyName];
                const childCol = child.properties[childColMeta.propertyName];

                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                andExp.operands.push(logicalExp);
            }
            relationExp = andExp.asOperand();

            if (relationMeta.relationType === "many") {
                type = "LEFT";
            }
            else if (!type) {
                type = relationMeta.nullable || relationMeta.isMaster ? "LEFT" : "INNER";
            }
        }

        this.relation = relationExp;
        this.type = type;
    }
    public parent: IEntityExpression<TE>;
    public child: IEntityExpression<TChild>;
    public type: JoinType;

    public isEmbedded: boolean;
    //#endregion

    //#region Properties
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
            child.parentJoin = clone;
        }
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        if (this.relation) {
            visitExpression(this.relation, (exp: IExpression) => {
                if (isColumnExp<unknown>(exp)) {
                    if (this.child === exp.entity) {
                        this._childColumns.push(exp);
                    }
                    else if (this.parent === exp.entity) {
                        this._parentColumns.push(exp);
                    }
                }
                else if (!(exp instanceof AndExpression || exp instanceof EqualExpression || exp instanceof StrictEqualExpression)) {
                    this._isManyManyRelation = true;
                }
            });

            if (!this._isManyManyRelation) {
                const childPks = this.child.primaryColumns;
                const parentPks = this.parent.primaryColumns;
                this._isManyManyRelation = this._childColumns.some((o) => !childPks.includes(o)) && this._parentColumns.some((o) => !parentPks.includes(o));
            }
        }
    }
    public reverse() {
        let reverseType = this.type;
        switch (reverseType) {
            case "LEFT": reverseType = "INNER"; break;
            case "RIGHT": reverseType = "LEFT"; break;
        }
        return new JoinRelation(this.child, this.parent, this.relation, reverseType);
    }
    //#endregion
}
