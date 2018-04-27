import { CollectionObject } from '../collection-object.model';
import { QRCodeInformation } from './table.model';

/**
 * EstablishmentQR Model
 */
export interface EstablishmentQR extends CollectionObject {
    is_active: boolean;
    establishment_id: string;
    establishment_qr_code: string;
    QR_code: string;
    QR_information: QRCodeInformation;
    QR_URI: string;
    uri_redirect: string;
    reward_points: number;
}