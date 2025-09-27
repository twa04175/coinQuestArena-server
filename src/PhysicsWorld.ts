import SAT from "sat";
import {MissionRoomState} from "./rooms/schema/MissionRoomState";
import {Collider, ColliderType} from "./rooms/schema/Prop";
import {Movement} from "./rooms/schema/Movement";
const { Box, Vector, Response } = SAT;

export class PhysicsWorld {
    private state: MissionRoomState;

    private tickRate: number;
    private dt: number;

    private playerW = 50;
    private playerH = 12;
    private playerXOffset = -2;
    private playerYOffset = 6;

    init(tickRate: number, state: MissionRoomState) {
        this.tickRate = tickRate;
        this.dt = 1 / this.tickRate;
        this.state = state;
    }

    private pCenter(px: number, py: number) {
        return { cx: px + this.playerXOffset, cy: py + this.playerYOffset };
    }

    private isCollideWith(px: number, py: number, col: Collider): boolean {
        const { cx, cy } = this.pCenter(px, py);

        const halfPw = this.playerW / 2;
        const halfPh = this.playerH / 2;
        const halfCw = col.w / 2;
        const halfCh = col.h / 2;

        // ⚠️ Collider (x,y)가 중심 기준이라 가정 (좌상단이면 변환 필요)
        const dx = Math.abs(cx - col.x);
        const dy = Math.abs(cy - col.y);

        return (dx < halfPw + halfCw) && (dy < halfPh + halfCh);
    }

    simulate() {
        const now = Date.now();
        const field = this.state.field;
        const halfW = field.width / 2;
        const halfH = field.height / 2;

        this.state.tick++;

        this.state.players.forEach((p) => {
            const mv = p.movement;

            const speed = Math.min(mv.speed, mv.maxSpeed);
            const dx = mv.dirX * speed * this.dt;
            const dy = mv.dirY * speed * this.dt;

            let nextX = mv.x + dx;
            let nextY = mv.y + dy;

            // 이번 틱에 충돌한 collider id 수집(중복 제거)
            const hitIds = new Set<string>();

            // --- 충돌 검사(축 분리: X -> Y), 정적 collider만 ---
            for (const c of field.colliders) {
                if (c.type !== ColliderType.Solid) continue;

                // X축 시도
                if (this.isCollideWith(nextX, mv.y, c)) {
                    nextX = mv.x; // X 이동 취소
                    hitIds.add(c.id);
                    // 축 정보까지 보고 싶으면:
                    // console.log(`[hit:X] player=${p.id} collider=${c.id}`);
                }

                // Y축 시도 (X 결과 반영 후 검사)
                if (this.isCollideWith(nextX, nextY, c)) {
                    nextY = mv.y; // Y 이동 취소
                    hitIds.add(c.id);
                    // console.log(`[hit:Y] player=${p.id} collider=${c.id}`);
                }
            }

            // --- 충돌 로그 출력(있을 때만) ---
            if (hitIds.size > 0) {
                console.log(
                    `[collision] tick=${this.state.tick} player=${p.id} collidedWith=[${[...hitIds].join(", ")}]`
                );
            }

            // --- 경계 클램프(맵 중앙 기준) ---
            if (nextX < -halfW) nextX = -halfW;
            if (nextX >  halfW) nextX =  halfW;
            if (nextY < -halfH) nextY = -halfH;
            if (nextY >  halfH) nextY =  halfH;

            // 최종 반영
            mv.x = nextX;
            mv.y = nextY;
            mv.tick = this.state.tick;
            mv.lastUpdateAt = now;
        });
    }

    getPlayerPhysicsState(id:string,mv:Movement) :Collider{
        const { cx, cy } = this.pCenter(mv.x, mv.y);

        return {
            id: id,
            type: ColliderType.Solid,
            x: cx,
            y: cy,
            w: this.playerW,
            h: this.playerH
        };
    }
}
