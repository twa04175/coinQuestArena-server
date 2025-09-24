import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import {ColliderType, Prop} from "./Prop";
import {addPropByTile, applyAscii} from "../../feildUtil";
import {MapGenerator} from "../../MapGenerator";

export enum TileKind {
    Empty = 0,
    Floor = 1,
    Wall = 2,
}

export class Field extends Schema {

    /** 타일 한 칸 픽셀 크기 */
    @type("uint8") chunkId: number = 1;

    /** 타일 한 칸 픽셀 크기 */
    @type("uint8") tileSize: number = 32;

    /** 필드 전체 타일 수 */
    @type("uint16") tilesWide: number = 96; // 예: 50*16=800px
    @type("uint16") tilesHigh: number = 96;

    @type([ Prop ]) props = new ArraySchema<Prop>();

    tiles:number[] = [];

    /** 인덱스 헬퍼 */
    getIndex(tx: number, ty: number) {
        return ty * this.tilesWide + tx;
    }

    constructor() {
        super();

        // 32x32 아스키 맵 생성 (테두리만 벽)
        const W = 96, H = 96;
        this.tiles = new  MapGenerator().generateMap(W,H);

        // ------- 테스트용 프롭 배치 (타일 좌표 기준) -------
        // 스폰
        addPropByTile(this, "spawn_0", 2, 2);

        // 텔레포트 (to 파라미터)
        addPropByTile(this, "tp_0", 21, 2, 1, 1, ColliderType.None, { to: "mission:2" });

        // 상자 (충돌 O)
        addPropByTile(this, "chest_0", 8, 5, 1, 1, ColliderType.Solid, { gold: "50" });
        addPropByTile(this, "chest_1", 14, 5, 1, 1, ColliderType.Solid, { gold: "100" });

        // 문/열쇠 예시
        addPropByTile(this, "door_A", 12, 3, 1, 1, ColliderType.Solid, { requires: "key_A" });
        addPropByTile(this, "key_A",  3,  6, 1, 1, ColliderType.None);

        // NPC / 픽업 / 센서존
        addPropByTile(this, "npc_bob",       5, 3, 1, 1, ColliderType.None, { dialog: "hello_adventurer" });
        addPropByTile(this, "pickup_hp_0",  10, 6, 1, 1, ColliderType.None, { heal: "30" });
        addPropByTile(this, "sensor_zone_0", 4, 6, 3, 2, ColliderType.None, { effect: "slow", value: "0.8" });

        // 고정 장애물(충돌 전용)
        addPropByTile(this, "obstacle_0", 6, 1, 1, 1, ColliderType.Solid);
    }
}
