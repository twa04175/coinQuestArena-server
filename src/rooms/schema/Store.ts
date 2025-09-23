import { Schema, type } from "@colyseus/schema";

export class Store extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";

    @type("string") mainItemId: string = "";

    //판매 아이템 충전시간
    @type("number") restockTime: number = 0; // seconds
    @type("number") lastRestock: number = 0; // timestamp
    @type("number") capacity: number = 0; // 최대 보유 아이템 수
    @type("number") currentStock: number = 0; // 현재 보유 아이템 수
    @type("number") restockAmount: number = 0; // 충전 아이템 수량

    @type(['string']) buyItems: string[] = [];  // 구매 아이템 목록
    @type({ map: "number" }) buyPrices = new Map<string, number>();
}
