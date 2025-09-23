import {Schema, type} from "@colyseus/schema";


export class Player extends Schema {
    @type("string") id: string;
    @type("string") name: string;   // 닉네임

    // 3) 위치/이동(서버 스냅샷에 필요)
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") dirX: number = 0;           // 입력 방향(-1..1), 서버 적분용/클라 힌트
    @type("number") dirY: number = 0;
    @type("number") speed: number = 200;        // px/s (서버 권위)

    // 4) 보간/동기화
    @type("number") tick: number = 0;           // 서버 틱(스냅샷 시간 기준)
    @type("number") lastProcessedInput: number = 0; // 클라 재적용용 ACK

    // 5) 게임플레이(점수/진행)
    @type("number") score: number = 0;
    @type("number") coins: number = 0;

    // 7) 안전/검증(간단 안티치트)
    @type("number") maxSpeed: number = 300;     // 서버 검증용 상한
    @type("number") lastUpdateAt: number = 0;   // 서버가 마지막으로 갱신한 시간(ms)

    constructor(name: string = "", sessionId: string = "") {
        super();
        this.id = sessionId;
        this.name = name;
    }
}
