import { Meteor } from 'meteor/meteor';
import { CodeGenerator } from './QR/codeGenerator';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { UserDetail } from '../../models/auth/user-detail.model';
import { Parameters } from '../../collections/general/parameter.collection';
import { Parameter } from '../../models/general/parameter.model';
import { UserPenalty } from '../../models/auth/user-penalty.model';
import { UserPenalties } from '../../collections/auth/user-penalty.collection';
import { EstablishmentQR } from '../../models/establishment/establishment-qr.model';
import { EstablishmentQRs } from '../../collections/establishment/establishment-qr.collection';
import { EstablishmentMedal } from '../../models/points/establishment-medal.model';
import { EstablishmentMedals } from '../../collections/points/establishment-medal.collection';

/**
 * This function create random code with 9 length to establishments
 */
export function createEstablishmentCode(): string {
    let _lText = '';
    let _lPossible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let _i = 0; _i < 9; _i++) {
        _lText += _lPossible.charAt(Math.floor(Math.random() * _lPossible.length));
    }
    return _lText;
}

/**
 * This function create random code with 5 length to establishments
 */
export function createTableCode(): string {
    let _lText = '';
    let _lPossible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let _i = 0; _i < 5; _i++) {
        _lText += _lPossible.charAt(Math.floor(Math.random() * _lPossible.length));
    }
    return _lText;
}

/**
 * This function create random code with 14 length to establishment QR
 */
export function createCodeToEstablishmentQR(): string {
    let _lText = '';
    let _lPossible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let _i = 0; _i < 14; _i++) {
        _lText += _lPossible.charAt(Math.floor(Math.random() * _lPossible.length));
    }
    return _lText;
}

/**
 * This function create QR Codes to establishments
 * @param {string} _pStringToCode
 * @return {Table} generateQRCode
 */
export function generateQRCode(_pStringToCode: string): any {
    let _lCodeGenerator = new CodeGenerator(_pStringToCode);
    _lCodeGenerator.generateCode();
    return _lCodeGenerator;
}

if (Meteor.isServer) {
    Meteor.methods({

        /**
         * Meteor method to validate establishment QR code
         * @param {string} _qrcode
         */
        verifyEstablishmentQRCode: function (_qrCode: string) {
            let _lEstablishmentQR: EstablishmentQR = EstablishmentQRs.findOne({ QR_code: _qrCode });
            if (typeof _lEstablishmentQR !== undefined || _lEstablishmentQR !== null) {
                return _lEstablishmentQR;
            } else {
                return null;
            }
        },

        /**
         * This Meteor Method return establishment object with QR Code condition
         * @param {string} _qrCode
         * @param {string} _userId
         */
        getEstablishmentByQRCode: function (_qrCode: string, _userId: string) {
            let _establishment: Establishment;
            let _lEstablishmentQR: EstablishmentQR = EstablishmentQRs.findOne({ QR_code: _qrCode });
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });

            if (_lUserDetail.penalties.length === 0) {
                let _lUserPenalty: UserPenalty = UserPenalties.findOne({ user_id: _userId, is_active: true });
                if (_lUserPenalty) {
                    let _lUserPenaltyDays: Parameter = Parameters.findOne({ name: 'penalty_days' });
                    let _lCurrentDate: Date = new Date();
                    let _lDateToCompare: Date = new Date(_lUserPenalty.last_date.setDate((_lUserPenalty.last_date.getDate() + Number(_lUserPenaltyDays.value))));
                    if (_lDateToCompare.getTime() >= _lCurrentDate.getTime()) {
                        let _lDay: number = _lDateToCompare.getDate();
                        let _lMonth: number = _lDateToCompare.getMonth() + 1;
                        let _lYear: number = _lDateToCompare.getFullYear();
                        throw new Meteor.Error('500', _lDay + '/' + _lMonth + '/' + _lYear);
                    } else {
                        UserPenalties.update({ _id: _lUserPenalty._id }, { $set: { is_active: false } });
                    }
                }
            }

            if (_lEstablishmentQR) {
                _establishment = Establishments.collection.findOne({ _id: _lEstablishmentQR.establishment_id });
                if (_establishment) {
                    if (_establishment.isActive) {
                        let _lEstablishmentMedal: EstablishmentMedal = EstablishmentMedals.findOne({ user_id: _userId, establishment_id: _establishment._id });

                        if (_lEstablishmentMedal) {
                            let _lNewQuantity: number = _lEstablishmentMedal.medals + 1;
                            EstablishmentMedals.update({ _id: _lEstablishmentMedal._id }, {
                                $set: {
                                    modification_date: new Date(),
                                    modification_user: _userId,
                                    medals: _lNewQuantity
                                }
                            });
                        } else {
                            EstablishmentMedals.insert({
                                creation_user: _userId,
                                creation_date: new Date(),
                                user_id: _userId,
                                establishment_id: _establishment._id,
                                medals: 1,
                                is_active: true
                            });
                        }

                        if (_lUserDetail.grant_start_points !== undefined && _lUserDetail.grant_start_points) {
                            let _lExpireDate = new Date();
                            let _lUserStartPoints: Parameter = Parameters.findOne({ name: 'user_start_points' });
                            let _lCurrentEstablishmentMedal: EstablishmentMedal = EstablishmentMedals.findOne({ user_id: _userId, establishment_id: _establishment._id });
                            let _lNewQuantity: number = _lCurrentEstablishmentMedal.medals + Number.parseInt(_lUserStartPoints.value.toString());
                            EstablishmentMedals.update({ _id: _lCurrentEstablishmentMedal._id }, {
                                $set: {
                                    modification_date: new Date(),
                                    modification_user: _userId,
                                    medals: _lNewQuantity
                                }
                            });
                            UserDetails.update({ _id: _lUserDetail._id }, { $set: { grant_start_points: false } });
                        }
                        return _establishment;
                    } else {
                        throw new Meteor.Error('200');
                    }
                } else {
                    throw new Meteor.Error('300');
                }
            } else {
                throw new Meteor.Error('400');
            }
        },

        /**
         * This method return establishment if exist o null if not
         */

        getCurrentEstablishmentByUser: function (_establishmentId: string) {
            let establishment = Establishments.collection.findOne({ _id: _establishmentId });

            if (typeof establishment != "undefined" || establishment != null) {
                return establishment;
            } else {
                return null;
            }
        },

        validateEstablishmentIsActive: function () {
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            if (userDetail) {
                let establishment = Establishments.collection.findOne({ _id: userDetail.establishment_work });
                return establishment.isActive;
            } else {
                return false;
            }
        }
    });
}
