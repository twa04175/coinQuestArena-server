import {MapSchema, Schema, type} from "@colyseus/schema";


/** 아이템 정의(마스터 데이터) */
export class Inventory extends Schema {
    @type({ map: "float32" }) items = new MapSchema<number>();
}
