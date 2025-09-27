import {Collider, ColliderType} from "./rooms/schema/Prop";

type EditorColliderData = {
    id:string,
    x:number,
    y:number,
    offSetX:number,
    offsetY:number,
    width:number,
    height:number
}

export class DataManager {
    private static _instance: DataManager;

    static get instance(): DataManager {
        if (this._instance === undefined) {
            this._instance = new DataManager();
        }
        return this._instance;
    }

    private itemData =[
        { "id": "RICE", "name": "쌀", "description": "농업에서 직접 생산되는 기본 식량 자원으로, 가공 및 외식 산업의 근간이 된다.", "tier": 1 },
        { "id": "IRON_ORE", "name": "철광석", "description": "제철 산업의 핵심 원료로, 철강 및 제조업 발전에 필수적이다.", "tier": 1 },
        { "id": "CRUDE_OIL", "name": "원유", "description": "에너지와 화학 제품의 원천 자원으로, 운송 및 석유화학 산업을 움직인다.", "tier": 1 },

        { "id": "FLOUR", "name": "밀가루", "description": "쌀을 제분하여 만든 가공 식재료로, 빵·면류 등의 기초 원료가 된다.", "tier": 2 },
        { "id": "STEEL", "name": "철강", "description": "철광석을 제련하여 만든 소재로, 건설과 제조업 전반에 사용된다.", "tier": 2 },
        { "id": "GASOLINE", "name": "휘발유", "description": "원유를 정제하여 얻는 대표적인 연료로, 운송 산업의 핵심 동력원이다.", "tier": 2 },
        { "id": "PLASTIC", "name": "플라스틱", "description": "원유에서 추출한 석유화학 제품으로, 다양한 생활 및 산업용품의 재료다.", "tier": 2 },

        { "id": "BAKERY_CO", "name": "제과점", "description": "밀가루와 쌀을 활용하여 빵, 떡 등을 생산·판매하는 외식업체.", "tier": 3 },
        { "id": "CONSTRUCTION_CO", "name": "건설사", "description": "철강을 사용하여 건물과 인프라를 건설하는 기업.", "tier": 3 },
        { "id": "TRANSPORT_CO", "name": "운송사", "description": "휘발유와 철강 기반 장비를 활용하여 육상·해운·항공 운송을 담당하는 기업.", "tier": 3 },
        { "id": "PETROCHEM_CO", "name": "석유화학사", "description": "원유에서 플라스틱·합성섬유 등을 생산하는 기업.", "tier": 3 }
    ]

    private initCollisionData:EditorColliderData[] = [
        {
            id:"build_bank",
            x:-450,
            y: 0,
            offSetX:0,
            offsetY:86,
            width:320,
            height:208
        },
        {
            id:"build_leaderboard",
            x:-2.789,
            y: 376.283,
            offSetX:0,
            offsetY:8.9,
            width:194.474,
            height:61.46
        },
        {
            id:"build_exchange",
            x:548.492,
            y: -33.05,
            offSetX:0,
            offsetY:117.6,
            width:440,
            height:235.1
        }
    ]

    getItemData(itemId:string){
        console.log('get item data ',itemId);
        return this.itemData.find(item=>item.id === itemId);
    }

    getAllItemKeys(): string[] {
        return this.itemData.map(item => item.id);
    }

    getInitCollisionData():Collider[]{
        return this.initCollisionData.map(item=>this.calcOffset(item));
    }

    calcOffset(editorData:EditorColliderData): Collider{
        return {
            id: editorData.id,
            x: editorData.x + editorData.offSetX,
            y: editorData.y + editorData.offsetY,
            w: editorData.width,
            h: editorData.height,
            type:ColliderType.Solid
        }
    }
}
