import { Meteor } from 'meteor/meteor';
import { RewardHistory } from '../../models/points/reward-history.model';
import { RewardHistories } from '../../collections/points/reward-history.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { Item } from '../../models/menu/item.model';
import { Items } from '../../collections/menu/item.collection';
import { Reward } from '../../models/establishment/reward.model';
import { Rewards } from '../../collections/establishment/reward.collection';
import { EstablishmentMedal } from '../../models/points/establishment-medal.model';
import { EstablishmentMedals } from '../../collections/points/establishment-medal.collection';
import { RewardConfirmation } from '../../models/points/reward-confirmation.model';
import { RewardsConfirmations } from '../../collections/points/reward-confirmation.collection';
import { EstablishmentPoint } from '../../models/points/establishment-point.model';
import { EstablishmentPoints } from '../../collections/points/establishment-points.collection';
import { NegativePoints } from '../../collections/points/negative-points.collection';

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This functon allow generate reward history
         * @param {RewardConfirmation} _pRewardConfirmation
         */
        generateRewardHistory: function (_pRewardConfirmation: RewardConfirmation) {
            let _lEstablishment: Establishment = Establishments.findOne({ _id: _pRewardConfirmation.establishment_id });
            let _lReward: Reward = Rewards.findOne({ _id: _pRewardConfirmation.reward_id });
            let _lItem: Item = Items.findOne({ _id: _lReward.item_id });

            RewardHistories.insert({
                creation_user: _pRewardConfirmation.user_id,
                creation_date: new Date(),
                establishment_id: _lEstablishment._id,
                establishment_name: _lEstablishment.name,
                establishment_address: _lEstablishment.address,
                item_name: _lItem.name,
                item_quantity: _lReward.item_quantity,
                redeemed_medals: _pRewardConfirmation.medals_to_redeem
            });
        },

        /**
         * Function to redeem user medals
         * @param {RewardConfirmation} _pRewardConfirmation
         */
        redeemUserMedals: function (_pRewardConfirmation: RewardConfirmation) {
            let _establishmentPoints: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _pRewardConfirmation.establishment_id });
            let _pointsResult: number = Number.parseInt(_establishmentPoints.current_points.toString()) - Number.parseInt(_pRewardConfirmation.medals_to_redeem.toString());
            let _lEstablishmentMedal: EstablishmentMedal = EstablishmentMedals.findOne({ user_id: _pRewardConfirmation.user_id, establishment_id: _pRewardConfirmation.establishment_id });

            if (_pointsResult >= 0) {
                EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult } });
            } else {
                let _negativePoints: number;
                if (_establishmentPoints.current_points > 0) {
                    _negativePoints = Number.parseInt(_pRewardConfirmation.medals_to_redeem.toString()) - Number.parseInt(_establishmentPoints.current_points.toString());
                    if (_negativePoints < 0) { _negativePoints = (_negativePoints * (-1)); }
                } else {
                    _negativePoints = Number.parseInt(_pRewardConfirmation.medals_to_redeem.toString());
                }
                NegativePoints.insert({
                    establishment_id: _pRewardConfirmation.establishment_id,
                    user_id: _pRewardConfirmation.user_id,
                    points: _negativePoints,
                    paid: false
                });
                EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult, negative_balance: true } });
            }

            let _lNewMedals: number = Number.parseInt(_lEstablishmentMedal.medals.toString()) - Number.parseInt(_pRewardConfirmation.medals_to_redeem.toString());
            EstablishmentMedals.update({ _id: _lEstablishmentMedal._id }, {
                $set: {
                    modification_user: _lEstablishmentMedal.user_id,
                    modification_date: new Date(),
                    medals: _lNewMedals
                }
            });
            Meteor.call('generateRewardHistory', _pRewardConfirmation);
            RewardsConfirmations.update({ _id: _pRewardConfirmation._id }, {
                $set: {
                    modification_user: _lEstablishmentMedal.user_id,
                    modification_date: new Date(),
                    is_confirmed: true
                }
            });
        }
    });
}