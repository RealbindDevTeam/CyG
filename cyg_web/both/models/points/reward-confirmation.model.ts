import { CollectionObject } from '../collection-object.model';

/**
 * RewardConfirmation Model
 */
export interface RewardConfirmation extends CollectionObject {
    establishment_id: string;
    user_id: string;
    medals_to_redeem: number;
    reward_id: string;
    is_confirmed: boolean;
}