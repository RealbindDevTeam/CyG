import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Email } from 'meteor/email';
import { EmailContents } from '../../collections/general/email-content.collection';
import { EmailContent } from '../../models/general/email-content.model';
import { LangDictionary } from '../../models/general/email-content.model';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Tables } from '../../collections/establishment/table.collection';
import { Table } from '../../models/establishment/table.model';
import { PaymentsHistory } from '../../collections/payment/payment-history.collection';
import { PaymentHistory } from '../../models/payment/payment-history.model';
import { Users } from '../../collections/auth/user.collection';
import { User } from '../../models/auth/user.model';
import { Parameters } from '../../collections/general/parameter.collection';
import { Parameter } from '../../models/general/parameter.model';
import { SSR } from 'meteor/meteorhacks:ssr';
import { RewardPoint } from '../../models/establishment/reward-point.model';
import { RewardPoints } from '../../collections/establishment/reward-point.collection';
import { UserDetail } from '../../models/auth/user-detail.model';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { EstablishmentPoints } from '../../collections/points/establishment-points.collection';
import { EstablishmentPoint } from '../../models/points/establishment-point.model';
import { EstablishmentMedals } from '../../collections/points/establishment-medal.collection';
import { } from '../../models/points/'


if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This function evaluates de the current medals for send warning to user every two days
         * @param {string} _countryId
         */
        checkCurrentMedals: function (_countryId: string) {
            let parameter: Parameter = Parameters.collection.findOne({ name: 'from_email' });
            let iurest_url: Parameter = Parameters.collection.findOne({ name: 'iurest_url' });
            let facebook: Parameter = Parameters.collection.findOne({ name: 'facebook_link' });
            let twitter: Parameter = Parameters.collection.findOne({ name: 'twitter_link' });
            let instagram: Parameter = Parameters.collection.findOne({ name: 'instagram_link' });
            let iurestImgVar: Parameter = Parameters.collection.findOne({ name: 'iurest_img_url' });
            let establishmentsArray: string[] = [];
            let max_medals: number = parseInt(Parameters.collection.findOne({ name: 'max_medals_to_advice' }).value);

            Establishments.collection.find({ countryId: _countryId, is_beta_tester: false, isActive: true }).forEach(function <Establishment>(establishment, index, ar) {
                establishmentsArray.push(establishment._id);
            });

            EstablishmentPoints.collection.find({ establishment_id: { $in: establishmentsArray }, negative_balance: false, negative_advice_counter: { $eq: 0 } }).forEach(function <EstablishmentPoint>(establishmentPoint, index, ar) {
                if (establishmentPoint.current_points <= max_medals && establishmentPoint.current_points > 0) {
                    Establishments.collection.find({ _id: establishmentPoint.establishment_id }).forEach(function <Establishment>(establishment2, index, ar) {
                        let user: User = Users.collection.findOne({ _id: establishment2.creation_user });
                        let emailContent: EmailContent = EmailContents.collection.findOne({ language: user.profile.language_code });
                        let greetVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'greetVar');
                        let greeting: string = (user.profile && user.profile.full_name) ? (greetVar + ' ' + user.profile.full_name + ",") : greetVar;
                        SSR.compileTemplate('checkMedalsEmailHtml', Assets.getText('check-medals-email.html'));

                        var emailData = {
                            greeting: greeting,
                            reminderMsgVar: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderCurrentMedals1'),
                            establishmentName: establishment2.name,
                            reminderMsgVar2: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderCurrentMedals2'),
                            currentMedals: establishmentPoint.current_points,
                            reminderMsgVar3: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderCurrentMedals3'),
                            reminderMsgVar4: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderCurrentMedals4'),
                            regardVar: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'regardVar'),
                            followMsgVar: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'followMsgVar'),
                            iurestUrl: iurest_url.value,
                            facebookLink: facebook.value,
                            twitterLink: twitter.value,
                            instagramLink: instagram.value,
                            iurestImgVar: iurestImgVar.value
                        };

                        Email.send({
                            to: user.emails[0].address,
                            from: parameter.value,
                            subject: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'checkMedalsSubjectVar'),
                            html: SSR.render('checkMedalsEmailHtml', emailData),
                        });
                    });
                }
            });
        },
        /**
         * This function evaluates de the current medals for send warning to user every two days
         * @param {string} _countryId
         */
        checkNegativeMedals: function (_countryId: string) {
            let parameter: Parameter = Parameters.collection.findOne({ name: 'from_email' });
            let iurest_url: Parameter = Parameters.collection.findOne({ name: 'iurest_url' });
            let facebook: Parameter = Parameters.collection.findOne({ name: 'facebook_link' });
            let twitter: Parameter = Parameters.collection.findOne({ name: 'twitter_link' });
            let instagram: Parameter = Parameters.collection.findOne({ name: 'instagram_link' });
            let iurestImgVar: Parameter = Parameters.collection.findOne({ name: 'iurest_img_url' });
            let max_days: number = parseInt(Parameters.collection.findOne({ name: 'max_days_to_advice' }).value);
            let establishmentsArray: string[] = [];

            Establishments.collection.find({ countryId: _countryId, is_beta_tester: false, isActive: true }).forEach(function <Establishment>(establishment, index, ar) {
                establishmentsArray.push(establishment._id);
            });

            EstablishmentPoints.collection.find({ establishment_id: { $in: establishmentsArray }, negative_balance: true, negative_advice_counter: { $gte: 0 } }).forEach(function <EstablishmentPoint>(establishmentPoint, index, ar) {

                let advice_aux: number = establishmentPoint.negative_advice_counter + 1;
                if (establishmentPoint.negative_advice_counter <= max_days) {
                    EstablishmentPoints.collection.update({ _id: establishmentPoint._id }, {
                        $set: {
                            negative_advice_counter: establishmentPoint.negative_advice_counter + 1
                        }
                    });

                    Establishments.collection.find({ _id: establishmentPoint.establishment_id }).forEach(function <Establishment>(establishment2, index, ar) {
                        let user: User = Users.collection.findOne({ _id: establishment2.creation_user });
                        let emailContent: EmailContent = EmailContents.collection.findOne({ language: user.profile.language_code });
                        let greetVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'greetVar');
                        let greeting: string = (user.profile && user.profile.full_name) ? (greetVar + ' ' + user.profile.full_name + ",") : greetVar;
                        SSR.compileTemplate('checkNegativeEmailHtml', Assets.getText('check-negative-email.html'));

                        var emailData = {
                            greeting: greeting,
                            reminderMsgVar: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderNegativeMedals1'),
                            establishmentName: establishment2.name,
                            reminderMsgVar2: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderNegativeMedals2'),
                            currentMedals: establishmentPoint.current_points * -1,
                            reminderMsgVar3: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderNegativeMedals3'),
                            reminderMsgVar4: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'reminderNegativeMedals4'),
                            regardVar: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'regardVar'),
                            followMsgVar: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'followMsgVar'),
                            iurestUrl: iurest_url.value,
                            facebookLink: facebook.value,
                            twitterLink: twitter.value,
                            instagramLink: instagram.value,
                            iurestImgVar: iurestImgVar.value
                        };

                        Email.send({
                            to: user.emails[0].address,
                            from: parameter.value,
                            subject: Meteor.call('getEmailContent', emailContent.lang_dictionary, 'checkNegativeSubjectVar'),
                            html: SSR.render('checkNegativeEmailHtml', emailData),
                        });
                    });
                } else {
                    Establishments.collection.update({ _id: establishmentPoint.establishment_id }, {
                        $set: {
                            isActive: false,
                            modification_date: new Date()
                        }
                    });

                    EstablishmentMedals.collection.find({ establishment_id: establishmentPoint.establishment_id }).forEach(function <EstablishmentMedal>(establishmentMedal, index, ar) {
                        EstablishmentMedals.collection.update({ _id: establishmentMedal._id }, {
                            $set: {
                                is_active: false,
                                modification_date: new Date()
                            }
                        });
                    });
                }
            });
        },
        /**
         * This function gets the value from EmailContent collection
         * @param {string} _countryId
         * @return {string}
         */
        getEmailContent(_langDictionary: LangDictionary[], _label: string): string {
            let value = _langDictionary.filter(function (wordTraduced) {
                return wordTraduced.label == _label;
            });
            return value[0].traduction;
        },
        /**
         * This function convert the day and returning in format yyyy-m-d
         * @param {Date} _date
         * @return {string}
         */
        convertDateToSimple: function (_date: Date) {
            let year = _date.getFullYear();
            let month = _date.getMonth() + 1;
            let day = _date.getDate();
            return day.toString() + '/' + month.toString() + '/' + year.toString();
        }
    });
}