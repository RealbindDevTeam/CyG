import { CollectionObject } from '../collection-object.model';

/**
 * EstablishmentPoints model
 */
export interface EstablishmentPoint extends CollectionObject {
    establishment_id: string;
    current_points: number;
    negative_balance: boolean;
    negative_advice_counter: number;
}

/**
 * Temporal interface to send bag plan main properties
 */
export interface Element {
    establishmentId: string;
    bagPlanId: string;
    bagPlanPrice: number;
    bagPlanCurrency: string;
    bagPlanPoints: number;
    creditPoints?: number;
    creditPrice?: number;
}
