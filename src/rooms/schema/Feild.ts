import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import {Collider, ColliderType, Prop} from "./Prop";
import {addPropByTile, applyAscii} from "../../feildUtil";
import {MapGenerator} from "../../MapGenerator";
import {DataManager} from "../../DataMananger";

export enum TileKind {
    Empty = 0,
    Floor = 1,
    Wall = 2,
}

export class Field extends Schema {
    /** 타일 한 칸 픽셀 크기 */
    @type("uint8") tileSize: number = 32;

    /** 필드 전체 타일 수 */
    @type("uint16") wCnt: number = 96; // 예: 50*16=800px
    @type("uint16") hCnt: number = 96;

    @type([ Prop ]) props = new ArraySchema<Prop>();

    colliders:Collider[] = [];

    tiles:number[] = [];
    width: number = this.wCnt * this.tileSize;
    height: number = this.hCnt * this.tileSize;

    /** 인덱스 헬퍼 */
    getIndex(tx: number, ty: number) {
        return ty * this.wCnt + tx;
    }

    constructor() {
        super();

        // 32x32 아스키 맵 생성 (테두리만 벽)
        const W = 96, H = 96;
        this.tiles = new  MapGenerator().generateMap(W,H);

        this.colliders = DataManager.instance.getInitCollisionData();

        console.log('Field created',this.wCnt,this.hCnt,this.width,this.height);
        console.dir(this.colliders);
    }
}
