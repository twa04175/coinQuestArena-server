// /rooms/utils/fieldUtils.ts

import {Field, TileKind} from "./rooms/schema/Feild";
import {ColliderType, Prop} from "./rooms/schema/Prop";

export function worldToTile(field: Field, x: number, y: number) {
    return { tx: Math.floor(x / field.tileSize), ty: Math.floor(y / field.tileSize) };
}

export function tileToWorld(field: Field, tx: number, ty: number) {
    return { x: tx * field.tileSize, y: ty * field.tileSize };
}

export function inBounds(field: Field, tx: number, ty: number) {
    return tx >= 0 && ty >= 0 && tx < field.wCnt && ty < field.hCnt;
}

export function setTile(field: Field, tx: number, ty: number, tile: number) {
    if (!inBounds(field, tx, ty)) return;
    field.tiles[field.getIndex(tx, ty)] = tile;
}
export function getTile(field: Field, tx: number, ty: number) {
    if (!inBounds(field, tx, ty)) return TileKind.Empty;
    return field.tiles[field.getIndex(tx, ty)];
}

export function aabbOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** 이동 충돌 검사: 타일 Wall + Solid Prop */
export function testMoveCollision(field: Field, nextX: number, nextY: number, w: number, h: number): boolean {
    // 타일
    const ts = field.tileSize;
    const minTx = Math.floor(nextX / ts);
    const minTy = Math.floor(nextY / ts);
    const maxTx = Math.floor((nextX + w - 1) / ts);
    const maxTy = Math.floor((nextY + h - 1) / ts);
    for (let ty = minTy; ty <= maxTy; ty++) {
        for (let tx = minTx; tx <= maxTx; tx++) {
            if (getTile(field, tx, ty) === TileKind.Wall) return true;
        }
    }
    // 프롭
    for (const prop of field.props) {
        if (prop.collider !== ColliderType.Solid) continue;
        if (aabbOverlap(nextX, nextY, w, h, prop.x, prop.y, prop.w, prop.h)) return true;
    }
    return false;
}

/** 현재 박스와 겹치는 모든 프롭 반환 */
export function findOverlappingProps(field: Field, x: number, y: number, w: number, h: number): Prop[] {
    const out: Prop[] = [];
    for (const prop of field.props) {
        if (aabbOverlap(x, y, w, h, prop.x, prop.y, prop.w, prop.h)) out.push(prop);
    }
    return out;
}

/** 프롭 추가 (타일 좌표 기반) */
export function addPropByTile(
    field: Field,
    propId: string,
    tx: number, ty: number,
    wTiles = 1, hTiles = 1,
    collider: ColliderType = ColliderType.None,
    props?: Record<string, string>
): Prop {
    const ts = field.tileSize;
    const p = new Prop().assign({
        propId,
        x: tx * ts,
        y: ty * ts,
        w: wTiles * ts,
        h: hTiles * ts,
        collider,
    });
    if (props) for (const [k, v] of Object.entries(props)) p.props.set(k, String(v));
    field.props.push(p);
    return p;
}

export function findPropIndexById(field: Field, propId: string) {
    return field.props.findIndex(p => p.propId === propId);
}

export function removePropById(field: Field, propId: string) {
    const idx = findPropIndexById(field, propId);
    if (idx >= 0) field.props.splice(idx, 1);
}

/** 아스키 → 타일 */
export function applyAscii(field: Field, ascii: string[]) {
    const H = ascii.length;
    const W = ascii[0]?.length ?? 0;

    field.wCnt = W;
    field.hCnt = H;

    field.tiles.length = 0;
    for (let i = 0; i < W * H; i++) field.tiles.push(TileKind.Floor);

    for (let y = 0; y < H; y++) {
        const row = ascii[y];
        for (let x = 0; x < W; x++) {
            const ch = row[x];
            switch (ch) {
                case "#": setTile(field, x, y, TileKind.Wall); break;
                case ".": setTile(field, x, y, TileKind.Floor); break;
                default : setTile(field, x, y, TileKind.Floor); break;
            }
        }
    }
}

