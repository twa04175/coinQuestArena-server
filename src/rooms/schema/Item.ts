import { Schema, type, MapSchema } from "@colyseus/schema";

export enum GoodTier {
    PRIMARY = 1,     // 쌀, 밀, 목재, 생선, 석탄, 철, 원유
    SECONDARY = 2,   // 밀가루, 옷감, 철강 ...
    TERTIARY = 3,    // 제과점, 건설업, 운송 서비스
}

/** 아이템 정의(마스터 데이터) */
export class Item extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("uint8") tier: number = GoodTier.PRIMARY;
}
