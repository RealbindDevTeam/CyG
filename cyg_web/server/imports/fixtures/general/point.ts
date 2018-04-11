import { Point } from '../../../../both/models/general/point.model';
import { Points } from '../../../../both/collections/general/point.collection';

export function loadPoints() {
    if(Points.find().cursor.count() === 0 ){
        const points: Point[] = [
            { _id: "1", point: 1 }, 
            { _id: "2", point: 2 }, 
            { _id: "3", point: 3 },
            { _id: "4", point: 4 }, 
            { _id: "5", point: 5 }, 
            { _id: "6", point: 6 }, 
            { _id: "7", point: 7 },
            { _id: "8", point: 8 }, 
            { _id: "9", point: 9 }, 
            { _id: "10", point: 10 }
        ];
        points.forEach((point:Point) => Points.insert(point));
    }
}