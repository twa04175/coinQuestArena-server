import {Schema, type} from "@colyseus/schema";

export class Movement extends Schema {
    // 위치/이동 (서버 스냅샷에 필요)
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") dirX: number = 0;     // 입력 방향(-1..1)
    @type("number") dirY: number = 0;
    @type("number") speed: number = 400;  // px/s (서버 권위)

    // 보간/동기화
    @type("number") tick: number = 0;     // 서버 틱
    @type("number") lastProcessedInput: number = 0; // 클라 보정 ACK

    // 안전/검증
    @type("number") maxSpeed: number = 500;
    @type("number") lastUpdateAt: number = 0;       // 서버 갱신 시각(ms)
}
