import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { CustomValidators } from '../../../../../../../../both/shared-components/validators/custom-validator';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Role } from '../../../../../../../../both/models/auth/role.model';
import { Roles } from '../../../../../../../../both/collections/auth/role.collection';
import { UserProfile } from '../../../../../../../../both/models/auth/user-profile.model';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';
import { User } from '../../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../../both/collections/auth/user.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'collaborators-edition',
    templateUrl: './collaborators-edition.component.html',
    providers: [UserLanguageService]
})
export class CollaboratorsEditionComponent implements OnInit, OnDestroy {

    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _collaboratorEditionForm: FormGroup;
    private _mdDialogRef: MatDialogRef<any>;

    private _establishments: Observable<Establishment[]>;
    private _roles: Observable<Role[]>;

    private _userProfile = new UserProfile();
    private selectUser: User;
    private selectUserDetail: UserDetail;

    private _selectedIndex: number = 0;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _userLang: string;
    private _error: string
    private _message: string;
    private _genderArray: any[] = [];

    /**
     * CollaboratorsEditionComponent constructor
     * @param {Router} _router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {NgZone} _zone 
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _router: Router,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _zone: NgZone,
        public _dialogRef: MatDialogRef<any>,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._collaboratorEditionForm = this._formBuilder.group({
            fullName: [this.selectUser.profile.full_name, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
            birthdate: [this.selectUserDetail.birthdate, [Validators.required]],
            establishment_work: [this.selectUserDetail.establishment_work],
            role: [this.selectUserDetail.role_id],
            phone: [this.selectUserDetail.phone],
            username: [this.selectUser.username],
            email: [],
            password: [],
            confirmPassword: [],
            new_password: new FormControl('', [Validators.minLength(8), Validators.maxLength(20)]),
            confirm_new_password: new FormControl('', [Validators.minLength(8), Validators.maxLength(20)]),
            gender: [this.selectUser.profile.gender, [Validators.required]]
        });
        this._establishments = Establishments.find({}).zone();
        this._roles = Roles.find({}).zone();

        this._genderArray = [{ value: "SIGNUP.MALE_GENDER", label: "SIGNUP.MALE_GENDER" },
        { value: "SIGNUP.FEMALE_GENDER", label: "SIGNUP.FEMALE_GENDER" },
        { value: "SIGNUP.OTHER_GENDER", label: "SIGNUP.OTHER_GENDER" }];
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This function validate date format
     */
    validateFormatDate() {
        let re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    }

    /**
     * Collaborator update
     */
    updateUser() {
        if (Meteor.userId()) {
            if (this._collaboratorEditionForm.valid) {
                if (this._collaboratorEditionForm.valid) {
                    Users.update({ _id: this.selectUser._id }, {
                        $set: {
                            profile: {
                                full_name: this._collaboratorEditionForm.value.fullName,
                                language_code: this.selectUser.profile.language_code,
                                image: this.selectUser.profile.image,
                                gender: this._collaboratorEditionForm.value.gender
                            }
                        }
                    });

                    UserDetails.update({ _id: this.selectUserDetail._id }, {
                        $set: {
                            establishment_work: this._collaboratorEditionForm.value.establishment_work,
                            birthdate: this._collaboratorEditionForm.value.birthdate,
                            phone: this._collaboratorEditionForm.value.phone
                        }
                    });

                    if (this._collaboratorEditionForm.value.new_password !== '' && this._collaboratorEditionForm.value.confirm_new_password !== '') {
                        if (this._collaboratorEditionForm.value.new_password !== this._collaboratorEditionForm.value.confirm_new_password) {
                            this._message = this.itemNameTraduction('SIGNUP.PASSWORD_NOT_MATCH');
                            this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                        } else {
                            MeteorObservable.call('changeUserPassword', this.selectUser._id, this._collaboratorEditionForm.value.new_password).subscribe(() => {
                                this._dialogRef.close();
                                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_COLLABORATOR_EDIT');
                                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                                this.cancel();
                            });
                        }
                    } else {
                        this._dialogRef.close();
                        this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_COLLABORATOR_EDIT');
                        this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                        this.cancel();
                    }
                }
            } else {
                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_FORM_INVALID');
                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
            }
        } else {
            this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_NOT_LOGIN');
            this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
            return;
        }
    }

    /**
     * Form reset
     */
    cancel() {
        this._collaboratorEditionForm.controls['fullName'].reset();
        this._collaboratorEditionForm.controls['birthdate'].reset();
        this._collaboratorEditionForm.controls['establishment_work'].reset();
        this._collaboratorEditionForm.controls['phone'].reset();
        this._collaboratorEditionForm.controls['username'].reset();
        this._collaboratorEditionForm.controls['email'].reset();
        this._collaboratorEditionForm.controls['password'].reset();
        this._collaboratorEditionForm.controls['confirmPassword'].reset();
        this._collaboratorEditionForm.controls['gender'].reset();

        this._router.navigate(['app/collaborators']);
    }

    /**
     * This function allow translate strings
     * @param itemName 
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

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
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