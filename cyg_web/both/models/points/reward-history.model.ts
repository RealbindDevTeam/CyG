import { CollectionObject } from '../collection-object.model';

/**
 * RewardHistory Model
 */
export interface RewardHistory extends CollectionObject {
    establishment_id: string;
    establishment_name: string;
    establishment_address: string;
    item_name: string;
    item_quantity: number;
    redeemed_medals: number;
}