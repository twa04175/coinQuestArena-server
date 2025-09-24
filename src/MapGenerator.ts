// MapGenerator.ts
export class MapGenerator {
    // ----- 타일셋 인덱스 (필요시 overrideTiles로 교체 가능) -----
    private GROUND = 1;
    private GROUND_NOISE_1 = 2;
    private GROUND_NOISE_2 = 3;
    private GROUND_NOISE_3 = 4;

    private GLASS = 5;
    private GLASS_NOISE_1 = 6;
    private GLASS_NOISE_2 = 7;
    private GLASS_NOISE_3 = 8;

    private GLASS_EDGE_L = 9;
    private GLASS_EDGE_R = 10;
    private GLASS_EDGE_T = 11;
    private GLASS_EDGE_B = 12;
    private GLASS_OUTER_CORNER_TR = 13;
    private GLASS_OUTER_CORNER_TL = 14;
    private GLASS_OUTER_CORNER_BR = 15;
    private GLASS_OUTER_CORNER_BL = 16;

    private GLASS_INNER_CORNER_TR = 17;
    private GLASS_INNER_CORNER_TL = 18;
    private GLASS_INNER_CORNER_BL = 19;
    private GLASS_INNER_CORNER_BR = 20;

    // ----- 파라미터 -----
    private groundNoiseRate = 0.12;   // 바닥 노이즈 비율
    private grassNoiseRate  = 0.20;   // 풀 내부 노이즈 비율

    // 전체 초원 면적 비율
    private grassAreaMin = 0.62;
    private grassAreaMax = 0.70;

    // 바이옴(덩어리) 개수 (최소 3)
    private biomeCountMin = 3;
    private biomeCountMax = 8;

    // 바이옴별 목표 면적 가중치
    private weightMin = 0.8;
    private weightMax = 1.2;

    // 🔸 덩어리 최소 면적
    private biomeMinArea = 40;

    // 바이옴끼리 최소 간격(타일) — 합체 방지
    private gapTiles = 2;

    // 맵 외곽 여백
    private margin = 2;

    // Rect/Square 비율
    private rectAspectMin = 1.3;  // 직사각형 가로/세로 비 최소
    private rectAspectMax = 2.2;  // 최대

    // L자 두께/길이 범위
    private L_thicknessMin = 3;
    private L_thicknessMax = 6;

    // 한 번 추가할 때 최소 신규 픽셀 수(가느다란 가시 방지)
    private minNewCellsAbs = 40;

    // 후처리: 작은 섬 제거/가시 가지치기
    private removeIslandMin = 40;
    private pruneIterations = 1;

    // ----- 시드 & PRNG -----
    private seed: number;
    private _s: number;
    constructor(seed: number = (Date.now() >>> 0)) {
        this.seed = seed >>> 0;
        this._s   = (seed ^ 0x9e3779b9) >>> 0;
    }

    public overrideTiles(ids: Partial<{
        GROUND:number, GROUND_NOISE_1:number, GROUND_NOISE_2:number, GROUND_NOISE_3:number,
        GLASS:number, GLASS_NOISE_1:number, GLASS_NOISE_2:number, GLASS_NOISE_3:number,
        GLASS_EDGE_L:number, GLASS_EDGE_R:number, GLASS_EDGE_T:number, GLASS_EDGE_B:number,
        GLASS_OUTER_CORNER_TR:number, GLASS_OUTER_CORNER_TL:number, GLASS_OUTER_CORNER_BR:number, GLASS_OUTER_CORNER_BL:number,
        GLASS_INNER_CORNER_TR:number, GLASS_INNER_CORNER_TL:number, GLASS_INNER_CORNER_BL:number, GLASS_INNER_CORNER_BR:number,
    }>) { Object.assign(this, ids); }

    private rnd(): number { let x=this._s; x^=x<<13; x^=x>>>17; x^=x<<5; this._s = x>>>0; return (this._s&0xffffffff)/0x100000000; }
    private irand(min: number, max: number) { return Math.floor(this.rnd() * (max - min + 1)) + min; }
    private rrange(min: number, max: number) { return min + (max - min) * this.rnd(); }

    private idx(x: number, y: number, w: number) { return y * w + x; }
    private inb(x: number, y: number, w: number, h: number) { return x >= 0 && y >= 0 && x < w && y < h; }
    private clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
    private orMask(a: Uint8Array, b: Uint8Array) { for (let i=0;i<a.length;i++) if (b[i]) a[i] = 1; }

    private dilate(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
        if (r <= 0) return src.slice();
        const out = new Uint8Array(w*h);
        for (let y=0;y<h;y++) for (let x=0;x<w;x++){
            let hit = 0;
            for (let dy=-r; dy<=r && !hit; dy++){
                const yy = y+dy; if (yy<0||yy>=h) continue;
                const yoff = yy*w;
                for (let dx=-r; dx<=r; dx++){
                    const xx = x+dx; if (xx<0||xx>=w) continue;
                    if (src[yoff+xx]) { hit=1; break; }
                }
            }
            out[y*w+x] = hit;
        }
        return out;
    }

    private hash2(x: number, y: number): number {
        let h = (x * 374761393 + y * 668265263 + (this.seed ^ 0x85ebca6b)) | 0;
        h = (h ^ (h >> 13)) | 0;
        h = Math.imul(h, 1274126177) | 0;
        return ((h ^ (h >> 16)) >>> 0) / 0xffffffff;
    }

    // ----- 타일 선택 -----
    private pickGround(x: number, y: number): number {
        const r = this.hash2(x, y);
        if (r >= this.groundNoiseRate) return this.GROUND;
        const r2 = this.hash2(x + 12345, y - 54321);
        if (r2 < 0.34) return this.GROUND_NOISE_1;
        if (r2 < 0.67) return this.GROUND_NOISE_2;
        return this.GROUND_NOISE_3;
    }
    private pickGrassCenter(x: number, y: number): number {
        const r = this.hash2(x - 777, y + 888);
        if (r >= this.grassNoiseRate) return this.GLASS;
        const r2 = this.hash2(x + 2468, y - 1357);
        if (r2 < 0.34) return this.GLASS_NOISE_1;
        if (r2 < 0.67) return this.GLASS_NOISE_2;
        return this.GLASS_NOISE_3;
    }

    // ----- 도형 그리기(허용영역 제한) -----
    private drawRectConstrained(target: Uint8Array, allow: Uint8Array,
                                w:number,h:number, x:number,y:number, rw:number,rh:number): number {
        if (rw<=0||rh<=0) return 0;
        const x0=this.clamp(x,0,w-1), y0=this.clamp(y,0,h-1);
        const x1=this.clamp(x+rw-1,0,w-1), y1=this.clamp(y+rh-1,0,h-1);
        // 허용 확인
        for(let yy=y0; yy<=y1; yy++){
            const off=yy*w;
            for(let xx=x0; xx<=x1; xx++){
                if (!allow[off+xx]) return 0;
            }
        }
        // 적용
        let added=0;
        for(let yy=y0; yy<=y1; yy++){
            const off=yy*w;
            for(let xx=x0; xx<=x1; xx++){
                const i=off+xx; if (!target[i]) { target[i]=1; added++; }
            }
        }
        return added;
    }

    // ㄱ (to Right+Down): anchor=(x,y)는 모서리 t×t 정사각형의 좌상단
    private drawL_G(target: Uint8Array, allow: Uint8Array,
                    w:number,h:number, x:number,y:number, Lh:number, Lv:number, t:number): number {
        if (t<=0||Lh<=t||Lv<=t) return 0;
        if (x<0||y<0||x+Lh-1>=w||y+Lv-1>=h) return 0;
        // 허용 확인
        for(let yy=y; yy<y+t; yy++){           // 가로 띠
            const off=yy*w;
            for(let xx=x; xx<x+Lh; xx++) if(!allow[off+xx]) return 0;
        }
        for(let yy=y; yy<y+Lv; yy++){          // 세로 띠
            const off=yy*w;
            for(let xx=x; xx<x+t; xx++) if(!allow[off+xx]) return 0;
        }
        // 적용
        let added=0;
        for(let yy=y; yy<y+t; yy++){ const off=yy*w; for(let xx=x; xx<x+Lh; xx++){ const i=off+xx; if(!target[i]){target[i]=1; added++;}}}
        for(let yy=y; yy<y+Lv; yy++){ const off=yy*w; for(let xx=x; xx<x+t;  xx++){ const i=off+xx; if(!target[i]){target[i]=1; added++;}}}
        return added;
    }

    // ㄴ (to Left+Down): anchor=(x,y)는 모서리 t×t 정사각형의 우상단
    private drawL_N(target: Uint8Array, allow: Uint8Array,
                    w:number,h:number, x:number,y:number, Lh:number, Lv:number, t:number): number {
        if (t<=0||Lh<=t||Lv<=t) return 0;
        const x0 = x-Lh+1, xCornerLeft = x-t+1;
        if (x0<0||y<0||x>=w||xCornerLeft<0||y+Lv-1>=h) return 0;
        // 허용 확인
        for(let yy=y; yy<y+t; yy++){ // 가로 띠(왼쪽으로 Lh)
            const off=yy*w;
            for(let xx=x0; xx<=x; xx++) if(!allow[off+xx]) return 0;
        }
        for(let yy=y; yy<y+Lv; yy++){ // 세로 띠(아래로 t, 오른쪽 끝이 x)
            const off=yy*w;
            for(let xx=xCornerLeft; xx<=x; xx++) if(!allow[off+xx]) return 0;
        }
        // 적용
        let added=0;
        for(let yy=y; yy<y+t; yy++){ const off=yy*w; for(let xx=x0; xx<=x; xx++){ const i=off+xx; if(!target[i]){target[i]=1; added++;}}}
        for(let yy=y; yy<y+Lv; yy++){ const off=yy*w; for(let xx=xCornerLeft; xx<=x; xx++){ const i=off+xx; if(!target[i]){target[i]=1; added++;}}}
        return added;
    }

    // ----- 분리된 바이옴(모양 제한: Rect/Square/ㄱ/ㄴ) -----
    private buildBiomesWithLimitedShapes(w:number, h:number): Uint8Array {
        const total = w*h;
        const targetArea = Math.floor(total * this.rrange(this.grassAreaMin, this.grassAreaMax));
        const k = Math.max(3, this.irand(this.biomeCountMin, this.biomeCountMax));

        // 면적 분배(최소 40 보장)
        const weights = Array.from({length:k}, ()=> this.rrange(this.weightMin, this.weightMax));
        const wsum = weights.reduce((a,b)=>a+b,0);
        const targets = weights.map(wi => Math.max(this.biomeMinArea, Math.floor((wi/wsum) * targetArea)));

        let occupied = new Uint8Array(total);
        const biomes: Uint8Array[] = [];

        for (let bi=0; bi<k; bi++) {
            const biome = new Uint8Array(total);
            let filled = 0;

            // 다른 바이옴들과 gapTiles 유지
            let allow = new Uint8Array(total);
            const blocked = this.dilate(occupied, w, h, this.gapTiles);
            for (let i=0;i<total;i++) allow[i] = blocked[i] ? 0 : 1;

            // 어떤 모양으로 할지 (0=Rect, 1=Square, 2=ㄱ, 3=ㄴ)
            const shape = this.irand(0,3);
            let ok = false;

            // --- S1. 시드 도형을 먼저 놓기 ---
            for (let tries=0; tries<200 && !ok; tries++) {
                if (shape === 0) { // Rect
                    const aspect = this.rrange(this.rectAspectMin, this.rectAspectMax);
                    let hRect = Math.max(3, Math.floor(Math.sqrt(targets[bi] / aspect)));
                    let wRect = Math.max(3, Math.floor(hRect * aspect));
                    // 경계/여백 보정
                    wRect = Math.min(wRect, w - 2*this.margin);
                    hRect = Math.min(hRect, h - 2*this.margin);
                    // 위치
                    const x = this.irand(this.margin, w - this.margin - wRect);
                    const y = this.irand(this.margin, h - this.margin - hRect);
                    const added = this.drawRectConstrained(biome, allow, w, h, x, y, wRect, hRect);
                    if (added >= this.minNewCellsAbs) { filled += added; ok = true; }
                } else if (shape === 1) { // Square
                    let s = Math.max(3, Math.floor(Math.sqrt(targets[bi])));
                    s = Math.min(s, Math.min(w, h) - 2*this.margin);
                    const x = this.irand(this.margin, w - this.margin - s);
                    const y = this.irand(this.margin, h - this.margin - s);
                    const added = this.drawRectConstrained(biome, allow, w, h, x, y, s, s);
                    if (added >= this.minNewCellsAbs) { filled += added; ok = true; }
                } else {
                    // ㄱ / ㄴ
                    const t = this.irand(this.L_thicknessMin, this.L_thicknessMax);
                    // A ≈ t*(Lh + Lv - t) → Lh+Lv ≈ A/t + t
                    const sum = Math.max(t*2+6, Math.floor(targets[bi] / t) + t);
                    const r = this.rrange(0.45, 0.55);
                    let Lh = Math.max(t+3, Math.floor(r * sum));
                    let Lv = Math.max(t+3, Math.floor((1-r) * sum));
                    // 지도 크기 보정
                    Lh = Math.min(Lh, w - 2*this.margin);
                    Lv = Math.min(Lv, h - 2*this.margin);

                    if (shape === 2) { // ㄱ (→,↓), anchor=(x,y)=모서리 좌상단
                        const x = this.irand(this.margin, w - this.margin - Lh);
                        const y = this.irand(this.margin, h - this.margin - Lv);
                        const added = this.drawL_G(biome, allow, w, h, x, y, Lh, Lv, t);
                        if (added >= this.minNewCellsAbs) { filled += added; ok = true; }
                    } else { // ㄴ (←,↓), anchor=(x,y)=모서리 우상단
                        const xMin = this.margin + t - 1;        // 세로 띠 오른쪽이 x
                        const xMax = w - this.margin - 1;
                        const y = this.irand(this.margin, h - this.margin - Lv);
                        const x = this.irand(Math.max(xMin, Lh-1), xMax);
                        const added = this.drawL_N(biome, allow, w, h, x, y, Lh, Lv, t);
                        if (added >= this.minNewCellsAbs) { filled += added; ok = true; }
                    }
                }
            }

            // 시드 실패하면 스킵
            if (!ok) { biomes.push(biome); continue; }

            // --- S2. 같은 모양으로 목표 면적까지 확장(작게 추가) ---
            let safe = 0;
            while (filled < targets[bi] && safe++ < 300) {
                allow = new Uint8Array(total);
                const blockedNow = this.dilate(occupied, w, h, this.gapTiles);
                for (let i=0;i<total;i++) allow[i] = blockedNow[i] ? 0 : 1;

                if (shape === 0) { // Rect — 크기 축소판을 랜덤 인접 위치에
                    const aspect = this.rrange(this.rectAspectMin, this.rectAspectMax);
                    let hRect = Math.max(3, Math.floor(Math.sqrt(targets[bi] / aspect) * this.rrange(0.5,0.8)));
                    let wRect = Math.max(3, Math.floor(hRect * aspect));
                    wRect = Math.min(wRect, w - 2*this.margin);
                    hRect = Math.min(hRect, h - 2*this.margin);
                    const x = this.irand(this.margin, w - this.margin - wRect);
                    const y = this.irand(this.margin, h - this.margin - hRect);
                    const added = this.drawRectConstrained(biome, allow, w, h, x, y, wRect, hRect);
                    if (added >= this.minNewCellsAbs) filled += added;
                } else if (shape === 1) { // Square
                    let s = Math.max(3, Math.floor(Math.sqrt(targets[bi]) * this.rrange(0.5,0.8)));
                    s = Math.min(s, Math.min(w, h) - 2*this.margin);
                    const x = this.irand(this.margin, w - this.margin - s);
                    const y = this.irand(this.margin, h - this.margin - s);
                    const added = this.drawRectConstrained(biome, allow, w, h, x, y, s, s);
                    if (added >= this.minNewCellsAbs) filled += added;
                } else if (shape === 2) { // ㄱ
                    const t = this.irand(this.L_thicknessMin, this.L_thicknessMax);
                    let Lh = this.irand(t+3, Math.max(t+3, Math.floor((targets[bi]/t)*0.4)));
                    let Lv = this.irand(t+3, Math.max(t+3, Math.floor((targets[bi]/t)*0.4)));
                    Lh = Math.min(Lh, w - 2*this.margin); Lv = Math.min(Lv, h - 2*this.margin);
                    const x = this.irand(this.margin, w - this.margin - Lh);
                    const y = this.irand(this.margin, h - this.margin - Lv);
                    const added = this.drawL_G(biome, allow, w, h, x, y, Lh, Lv, t);
                    if (added >= this.minNewCellsAbs) filled += added;
                } else { // ㄴ
                    const t = this.irand(this.L_thicknessMin, this.L_thicknessMax);
                    let Lh = this.irand(t+3, Math.max(t+3, Math.floor((targets[bi]/t)*0.4)));
                    let Lv = this.irand(t+3, Math.max(t+3, Math.floor((targets[bi]/t)*0.4)));
                    Lh = Math.min(Lh, w - 2*this.margin); Lv = Math.min(Lv, h - 2*this.margin);
                    const y = this.irand(this.margin, h - this.margin - Lv);
                    const xMin = Math.max(this.margin + t - 1, Lh-1);
                    const xMax = w - this.margin - 1;
                    const x = this.irand(xMin, xMax);
                    const added = this.drawL_N(biome, allow, w, h, x, y, Lh, Lv, t);
                    if (added >= this.minNewCellsAbs) filled += added;
                }
            }

            biomes.push(biome);
            this.orMask(occupied, biome);
        }

        // 합치기
        const finalMask = new Uint8Array(total);
        for (const b of biomes) this.orMask(finalMask, b);

        // 후처리: 작은 섬 제거 + 가시 가지치기(도형이 단순해서 1~2회면 충분)
        this.removeSmallIslands(finalMask, w, h, this.removeIslandMin);
        this.pruneSpurs(finalMask, w, h, this.pruneIterations);

        // 최소 3개 보장(혹시 모자라면 작은 정사각형을 떨어뜨려 추가)
        let comps = this.countComponents(finalMask, w, h);
        let guard = 0;
        while (comps < 3 && guard++ < 6) {
            const allow = (()=>{ const blk=this.dilate(finalMask,w,h,this.gapTiles); const a=new Uint8Array(total); for (let i=0;i<total;i++) a[i]=blk[i]?0:1; return a; })();
            const s = 6;
            const x = this.irand(this.margin, w - this.margin - s);
            const y = this.irand(this.margin, h - this.margin - s);
            this.drawRectConstrained(finalMask, allow, w, h, x, y, s, s);
            this.removeSmallIslands(finalMask, w, h, this.removeIslandMin);
            comps = this.countComponents(finalMask, w, h);
        }
        return finalMask;
    }

    private removeSmallIslands(mask: Uint8Array, w:number, h:number, minSize=40){
        const N=w*h, vis=new Uint8Array(N); const id=(x:number,y:number)=>y*w+x;
        const q:number[]=[]; const inb=(x:number,y:number)=>x>=0&&y>=0&&x<w&&y<h;
        for(let i=0;i<N;i++){
            if(!mask[i]||vis[i]) continue;
            const cells:number[]=[]; q.length=0; q.push(i); vis[i]=1;
            while(q.length){
                const v=q.pop()!; cells.push(v); const y=Math.floor(v/w), x=v-y*w;
                const nb=[[1,0],[-1,0],[0,1],[0,-1]];
                for(const [dx,dy] of nb){
                    const nx=x+dx, ny=y+dy; if(!inb(nx,ny)) continue;
                    const ni=id(nx,ny); if(mask[ni]&&!vis[ni]){vis[ni]=1; q.push(ni);}
                }
            }
            if(cells.length<minSize){ for(const v of cells) mask[v]=0; }
        }
    }

    private pruneSpurs(mask: Uint8Array, w:number, h:number, iterations=1){
        const inb=(x:number,y:number)=>x>=0&&y>=0&&x<w&&y<h; const id=(x:number,y:number)=>y*w+x;
        for(let it=0; it<iterations; it++){
            const kill:number[]=[];
            for(let y=0;y<h;y++) for(let x=0;x<w;x++){
                const i=id(x,y); if(!mask[i]) continue;
                let deg=0; if(inb(x+1,y)&&mask[id(x+1,y)])deg++; if(inb(x-1,y)&&mask[id(x-1,y)])deg++;
                if(inb(x,y+1)&&mask[id(x,y+1)])deg++; if(inb(x,y-1)&&mask[id(x,y-1)])deg++;
                if(deg<=1) kill.push(i);
            }
            for(const i of kill) mask[i]=0;
        }
    }

    private countComponents(mask: Uint8Array, w:number, h:number): number {
        const N=w*h, vis=new Uint8Array(N);
        const q:number[]=[]; const idx=(x:number,y:number)=>y*w+x;
        let comps=0;
        for (let i=0;i<N;i++){
            if (!mask[i]||vis[i]) continue;
            comps++;
            q.length=0; q.push(i); vis[i]=1;
            while(q.length){
                const v=q.pop()!; const y=Math.floor(v/w), x=v-y*w;
                const nb=[[1,0],[-1,0],[0,1],[0,-1]];
                for(const [dx,dy] of nb){
                    const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=w||ny>=h) continue;
                    const ni=idx(nx,ny); if(mask[ni] && !vis[ni]){ vis[ni]=1; q.push(ni); }
                }
            }
        }
        return comps;
    }

    // ----- 오토타일 라운딩 -----
    private paintGrassWithAutotile(tiles: number[], mask: Uint8Array, w: number, h: number) {
        const inside = (x: number, y: number) => this.inb(x, y, w, h) && mask[this.idx(x, y, w)] === 1;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (!inside(x, y)) continue;
                const n  = inside(x, y - 1);
                const s  = inside(x, y + 1);
                const wl = inside(x - 1, y);
                const e  = inside(x + 1, y);
                const nw = inside(x - 1, y - 1);
                const ne = inside(x + 1, y - 1);
                const sw = inside(x - 1, y + 1);
                const se = inside(x + 1, y + 1);

                if (!n && !wl) { tiles[this.idx(x, y, w)] = this.GLASS_OUTER_CORNER_TL; continue; }
                if (!n && !e ) { tiles[this.idx(x, y, w)] = this.GLASS_OUTER_CORNER_TR; continue; }
                if (!s && !e ) { tiles[this.idx(x, y, w)] = this.GLASS_OUTER_CORNER_BR; continue; }
                if (!s && !wl) { tiles[this.idx(x, y, w)] = this.GLASS_OUTER_CORNER_BL; continue; }

                if (!n)  { tiles[this.idx(x, y, w)] = this.GLASS_EDGE_T; continue; }
                if (!s)  { tiles[this.idx(x, y, w)] = this.GLASS_EDGE_B; continue; }
                if (!wl) { tiles[this.idx(x, y, w)] = this.GLASS_EDGE_L; continue; }
                if (!e)  { tiles[this.idx(x, y, w)] = this.GLASS_EDGE_R; continue; }

                if (n && wl && !nw) { tiles[this.idx(x, y, w)] = this.GLASS_INNER_CORNER_TL; continue; }
                if (n && e  && !ne) { tiles[this.idx(x, y, w)] = this.GLASS_INNER_CORNER_TR; continue; }
                if (s && e  && !se) { tiles[this.idx(x, y, w)] = this.GLASS_INNER_CORNER_BR; continue; }
                if (s && wl && !sw) { tiles[this.idx(x, y, w)] = this.GLASS_INNER_CORNER_BL; continue; }

                tiles[this.idx(x, y, w)] = this.pickGrassCenter(x, y);
            }
        }
    }

    // ----- 메인 -----
    public generateMap(w: number, h: number): number[] {
        const tiles = new Array<number>(w * h);

        // 1) 바닥 채우기 + 노이즈
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
            tiles[this.idx(x, y, w)] = this.pickGround(x, y);

        // 2) 제한된 모양(직사각형/정사각형/ㄱ/ㄴ)으로 바이옴 생성
        const mask = this.buildBiomesWithLimitedShapes(w, h);

        // 3) 오토타일 라운딩
        this.paintGrassWithAutotile(tiles, mask, w, h);

        return tiles;
    }
}
