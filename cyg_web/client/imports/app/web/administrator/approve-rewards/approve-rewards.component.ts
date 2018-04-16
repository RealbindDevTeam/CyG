import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { AlertConfirmComponent } from '../../general/alert-confirm/alert-confirm.component';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { Reward } from '../../../../../../both/models/establishment/reward.model';
import { Rewards } from '../../../../../../both/collections/establishment/reward.collection';
import { RewardConfirmation } from '../../../../../../both/models/points/reward-confirmation.model';
import { RewardsConfirmations } from '../../../../../../both/collections/points/reward-confirmation.collection';
import { User } from '../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../both/collections/auth/user.collection';
import { UserDetail, UserDetailImage } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { Item } from '../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../both/collections/menu/item.collection';

@Component({
    selector: 'approve-rewards',
    templateUrl: './approve-rewards.component.html',
    styleUrls: ['./approve-rewards.component.scss']
})
export class ApproveRewardsComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _mdDialogRef: MatDialogRef<any>;

    private _establishmentSub: Subscription;
    private _usersSubscription: Subscription;
    private _rewardSub: Subscription;
    private _rewardsConfirmationSub: Subscription;
    private _usersSub: Subscription;
    private _userDetailsSub: Subscription;
    private _itemsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _rewards: Observable<Reward[]>;
    private _rewardsConfirmations: Observable<RewardConfirmation[]>;
    private _items: Observable<Item[]>;

    private _thereAreEstablishments: boolean = true;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private btnCancelLbl: string;
    private _userFilter: string = "";
    private _establishmentFilter: string = "";
    private _loading: boolean = false;

    /**
     * ApproveRewardsComponent Constructor
     * @param {MatSnackBar} _snackBar 
     * @param {MatDialog} _dialog
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _snackBar: MatSnackBar,
        public _dialog: MatDialog,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
        this.btnCancelLbl = 'CANCEL';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        let _establishmentIds: string[] = [];
        this.removeSubscriptions();
        this._usersSubscription = MeteorObservable.subscribe('getUsers').takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                Establishments.collection.find({}).fetch().forEach((est) => {
                    _establishmentIds.push(est._id);
                });
                this._establishments.subscribe(() => { this.countEstablishments(); });
                this._rewardsConfirmationSub = MeteorObservable.subscribe('getRewardsConfirmationsByEstablishmentsIds', _establishmentIds).takeUntil(this._ngUnsubscribe).subscribe();
            });
        });
        this._rewardSub = MeteorObservable.subscribe('getRewards', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ creation_user: this._user }).zone();
            });
        });
        this._itemsSub = MeteorObservable.subscribe('getAdminActiveItems', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });
        this._usersSub = MeteorObservable.subscribe('getUsers').subscribe();
        this._userDetailsSub = MeteorObservable.subscribe('getUsersDetails').subscribe();
    }

    /**
     * Do filter by username or email address
     */
    doFilter() {
        let _lUsersId: string[] = new Array();
        this._loading = true;
        setTimeout(() => {
            this._rewardsConfirmations = null;
            if (this._userFilter) {
                let _lUserFilter = Users.collection.find({
                    $or: [
                        { "username": { $regex: this._userFilter }, 
                        { "emails.address": { $regex: this._userFilter } },
                        { "profile.name": { $regex: this._userFilter } }
                    ]
                });

                if (_lUserFilter.count() > 0) {
                    _lUserFilter.forEach(user => {
                        _lUsersId.push(user._id);
                    });
                    
                    this._rewardsConfirmations = RewardsConfirmations.find({
                        establishment_id: this._establishmentFilter,
                        creation_user: { $in: _lUsersId },
                        is_confirmed: false
                    }).zone();
                }
            }
            this._loading = false;
        }, 1000);
    }

    /**
     * Remove all suscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Function to search establishment rewards confirm
     * @param {string} _pEstablishmentId 
     */
    rewardsConfirmSearch(_pEstablishmentId: string) {
        this._rewardsConfirmations = RewardsConfirmations.find({ establishment_id: _pEstablishmentId, is_confirmed: false }).zone();
    }

    /**
     * Return user name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _lUser: User = Users.findOne({ _id: _pUserId });
        if (_lUser) {
            if (_lUser.username) {
                return _lUser.username;
            } else {
                if (_lUser.services) {
                    if (_lUser.services.facebook) {
                        return _lUser.services.facebook.name;
                    }
                }
            }
        }
    }

    /**
     * Return user image
     * @param {string} _pUserId 
     */
    getUserImage(_pUserId: string): string {
        let _lUser: User = Users.findOne({ _id: _pUserId });
        if (_lUser) {
            if (_lUser.services) {
                if (_lUser.services.facebook) {
                    return "http://graph.facebook.com/" + _lUser.services.facebook.id + "/picture/?type=large";
                } else {
                    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _pUserId });
                    if (_lUserDetail) {
                        let _lUserDetailImage: UserDetailImage = _lUserDetail.image;
                        if (_lUserDetailImage) {
                            return _lUserDetailImage.url;
                        } else {
                            return '/images/user_default_image.png';
                        }
                    }
                    else {
                        return '/images/user_default_image.png';
                    }
                }
            } else {
                return '/images/user_default_image.png';
            }
        } else {
            return '/images/user_default_image.png';
        }
    }

    /**
     * Function to approve reward confirmation 
     * @param {RewardConfirmation} _pRewardConfirmation 
     */
    approveRewardConfirmation(_pRewardConfirmation: RewardConfirmation): void {
        let _lDialogTitle = this.itemNameTraduction('APPROVE_REWARDS.APPROVE_REWARD');
        let _lDialogContent = this.itemNameTraduction('APPROVE_REWARDS.APPROVE_REWARD_MSG');
        let _lError: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', _lError, '', this.btnAcceptLbl, false);
            return;
        }
        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: _lDialogTitle,
                subtitle: '',
                content: _lDialogContent,
                buttonCancel: this.btnCancelLbl,
                buttonAccept: this.btnAcceptLbl,
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                this._loading = true;
                setTimeout(() => {
                    MeteorObservable.call('redeemUserMedals', _pRewardConfirmation).subscribe(() => {
                        this._loading = false;
                        let _lMessage = this.itemNameTraduction('APPROVE_REWARDS.REWARD_APPROVED');
                        this._snackBar.open(_lMessage, '', { duration: 2500 });
                    }, (error) => {
                        this._loading = false;
                        this.openDialog(this.titleMsg, '', error.reason, '', this.btnAcceptLbl, false);
                    });
                }, 1500);
            }
        });
    }

    /**
     * Function to disapprove reward confirmation
     * @param {RewardConfirmation} _pRewardConfirmation 
     */
    disapproveRewardConfirmation(_pRewardConfirmation: RewardConfirmation): void {
        let _lDialogTitle = this.itemNameTraduction('APPROVE_REWARDS.REJECT_REWARD');
        let _lDialogContent = this.itemNameTraduction('APPROVE_REWARDS.REJECT_REWARD_MSG');
        let _lError: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', _lError, '', this.btnAcceptLbl, false);
            return;
        }
        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: _lDialogTitle,
                subtitle: '',
                content: _lDialogContent,
                buttonCancel: this.btnCancelLbl,
                buttonAccept: this.btnAcceptLbl,
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                RewardsConfirmations.remove({ _id: _pRewardConfirmation._id });
                let _lMessage = this.itemNameTraduction('APPROVE_REWARDS.REWARD_REJECTED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
            }
        });
    }

    /**
     * Go to add new Establishment
     */
    goToAddEstablishment() {
        this._router.navigate(['/app/establishment-register']);
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
    }

    /**
     * Implements ngOnDestroy
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}