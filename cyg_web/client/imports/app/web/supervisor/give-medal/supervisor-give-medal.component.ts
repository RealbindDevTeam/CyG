import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { AlertConfirmComponent } from '../../general/alert-confirm/alert-confirm.component';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { User } from '../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../both/collections/auth/user.collection';
import { UserDetail, UserDetailImage } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';

@Component({
    selector: 'sup-give-medal',
    templateUrl: './supervisor-give-medal.component.html',
    styleUrls: ['./supervisor-give-medal.component.scss']
})
export class SupervisorGiveMedalComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _mdDialogRef: MatDialogRef<any>;

    private _establishmentSub: Subscription;
    private _usersSub: Subscription;
    private _userDetailsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _users: Observable<User[]>;

    private _establishmentWorkId: string;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private btnCancelLbl: string;
    private _userFilter: string = '';
    private _establishmentSelect: string;
    private _loading: boolean = false;

    /**
     * SupervisorGiveMedalComponent Constructor
     * @param {MatSnackBar} _snackBar 
     * @param {MatDialog} _dialog 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _snackBar: MatSnackBar,
        public _dialog: MatDialog,
        private _translate: TranslateService,
        private _ngZone: NgZone,
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
        this.removeSubscriptions();
        this._usersSub = MeteorObservable.subscribe('getUsers').takeUntil(this._ngUnsubscribe).subscribe();
        this._userDetailsSub = MeteorObservable.subscribe('getUsersDetails').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentWorkId = UserDetails.findOne({ user_id: this._user }).establishment_work;
                this._establishmentSelect = this._establishmentWorkId;
                this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._establishments = Establishments.find({ _id: this._establishmentWorkId }).zone();
                    });
                });
            });
        });
    }

    /**
     * Function to filter users
     */
    doFilter(): void {
        let _lUsersId: string[] = new Array();
        let _lUserDetailsId: string[] = new Array();
        this._loading = true;
        setTimeout(() => {
            this._users = null;
            if (this._userFilter) {
                let _lUserFilter = Users.collection.find({
                    $or: [
                        { "username": { $regex: this._userFilter } },
                        { "emails.address": { $regex: this._userFilter } },
                        { "profile.name": { $regex: this._userFilter } }
                    ]
                });

                if (_lUserFilter.count() > 0) {
                    _lUserFilter.forEach((user: User) => {
                        _lUsersId.push(user._id);
                    });

                    UserDetails.collection.find({ user_id: { $in: _lUsersId }, role_id: '400' }).fetch().forEach((us) => {
                        _lUserDetailsId.push(us.user_id);
                    });

                    this._users = Users.find({ _id: { $in: _lUserDetailsId } }).zone();
                }
            }
            this._loading = false;
        }, 1000);
    }

    /**
     * Function to give medal to specific user
     * @param {string} _pUserId 
     */
    giveMedalToUser(_pUserId: string) {
        let _lDialogTitle = this.itemNameTraduction('GIVE_MEDAL.GIVE_MEDAL_TITLE');
        let _lDialogContent = this.itemNameTraduction('GIVE_MEDAL.GIVE_MEDAL_SUBTITLE') + this.getUserName(_pUserId);
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
                    MeteorObservable.call('giveMedalToUser', this._establishmentWorkId, _pUserId).subscribe(() => {
                        this._loading = false;
                        let _lMessage = this.itemNameTraduction('GIVE_MEDAL.MEDAL_GIVEN');
                        this._snackBar.open(_lMessage, '', { duration: 2500 });
                        this._users = null;
                        this._userFilter = '';
                    }, (error) => {
                        this._users = null;
                        this._userFilter = '';
                        this._loading = false;
                        this.openDialog(this.titleMsg, '', error.reason, '', this.btnAcceptLbl, false);
                    });
                }, 1500);
            }
        });
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
     * Remove all suscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}