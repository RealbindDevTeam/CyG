import { CollectionObject } from '../collection-object.model';

/**
 * EstablishmentMedal Model
 */
export interface EstablishmentMedal extends CollectionObject {
    user_id: string;
    establishment_id: string;
    medals: number;
    is_active: boolean;
}