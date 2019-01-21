import { Entity } from "../../../src/Decorator/Entity/Entity";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { AutoDetail } from "./AutoDetail";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { BooleanColumn } from "../../../src/Decorator/Column/BooleanColumn";
import { DeletedColumn } from "../../../src/Decorator/Column/DeletedColumn";
import { CreatedDateColumn } from "../../../src/Decorator/Column/CreatedDateColumn";
import { ModifiedDateColumn } from "../../../src/Decorator/Column/ModifiedDateColumn";
import { BeforeSave } from "../../../src/Decorator/EventHandler/BeforeSave";
import { ISaveEventParam } from "../../../src/MetaData/Interface/ISaveEventParam";
import { AfterSave } from "../../../src/Decorator/EventHandler/AfterSave";

@Entity("AutoParent")
export class AutoParent {
    @PrimaryKey()
    @IntegerColumn({ columnType: "int", autoIncrement: true })
    public id: number;
    @StringColumn()
    public name: string;
    @BooleanColumn({ default: () => true })
    public isDefault: boolean;
    @DeletedColumn()
    public isDeleted: boolean;
    @CreatedDateColumn()
    public createdDate: Date;
    @ModifiedDateColumn()
    public modifiedDate: Date;

    @Relationship<AutoParent>("has", "many", AutoDetail || "AutoDetail", [(o) => o.id])
    public details: AutoDetail[];

    @BeforeSave<AutoParent>()
    public beforeSave(entity: AutoParent, param: ISaveEventParam) {
        // before save
    }

    @AfterSave<AutoParent>()
    public afterSave(entity: AutoParent, param: ISaveEventParam) {
        // after save
    }
}
