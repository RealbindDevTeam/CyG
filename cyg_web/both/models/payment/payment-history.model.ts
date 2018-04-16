import { CollectionObject } from '../collection-object.model';
import { Element } from '../points/establishment-point.model';

export interface PaymentHistory extends CollectionObject {
    establishment_ids: Element[];
    startDate?: Date;
    endDate?: Date;
    month: string;
    year: string;
    status: string;
    paymentTransactionId?: string;
    paymentValue?: number;
    currency?: string;
}