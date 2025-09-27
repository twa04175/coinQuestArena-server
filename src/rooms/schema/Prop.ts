import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

/** 콜라이더 타입 */
export enum ColliderType {
    None = 0,     // 충돌 없음
    Solid = 1,    // 벽/장애물
}

/** 오브젝트(충돌/트리거 공통) */
export class Prop extends Schema {
    @type("string") propId: string;

    @type("int32") x: number = 0;
    @type("int32") y: number = 0;
    @type("int16") w: number = 16;
    @type("int16") h: number = 16;

    collider: ColliderType = ColliderType.None;

    @type({ map: "string" }) props = new MapSchema<string>();
}

export type Collider ={
    id:string,
    x:number,
    y:number,
    w:number,
    h:number
    type:ColliderType
}
