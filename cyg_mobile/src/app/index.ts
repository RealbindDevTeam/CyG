import { InitialComponent } from '../pages/auth/initial/initial';
import { SignupComponent } from '../pages/auth/signup/signup';
import { SigninComponent } from '../pages/auth/signin/signin';
import { SettingsPage } from '../pages/customer/home/popover-options/settings/settings';
import { ChangeEmailPage } from '../pages/customer/home/popover-options/settings/change-email/change-email';
import { ChangePasswordPage } from '../pages/customer/home/popover-options/settings/change-password/change-password';
import { HomePage } from '../pages/customer/home/home';
import { ModalSchedule } from '../pages/customer/establishment-list/establishment-list-detail/modal-schedule/modal-schedule';
import { RewardListComponent } from '../pages/customer/establishment-list/establishment-list-detail/reward-list/reward-list';
import { PointsPage } from '../pages/customer/points/points/points';
import { PointsDetailPage } from '../pages/customer/points/points-detail/points-detail';
import { PopoverOptionsPage } from '../pages/customer/home/popover-options/popover-options';
import { LightboxPage } from "../pages/general/lightbox/lightbox";
import { EstablishmentListPage } from "../pages/customer/establishment-list/establishment-list";
import { EstablishmentListDetailPage } from "../pages/customer/establishment-list/establishment-list-detail/establishment-list-detail";
import { MenuByEstablishmentPage } from "../pages/customer/establishment-list/menu-by-establishment/menu-by-establishment";
import { ItemCardEstablishmentComponent } from "../pages/customer/establishment-list/menu-by-establishment/item-card-establishment";
import { ItemDetailEstablishmentPage } from "../pages/customer/establishment-list/menu-by-establishment/item-detail-establishment/item-detail-establishment";
import { AdditionsEstablishmentPage } from "../pages/customer/establishment-list/additions-establishment/additions-establishment";
import { ScanCodePage } from '../pages/customer/scan-code/scan-code';

export const PAGES_DECLARATIONS = [
    InitialComponent,
    SignupComponent,
    SettingsPage,
    ChangeEmailPage,
    ChangePasswordPage,
    SigninComponent,
    HomePage,
    ModalSchedule,
    RewardListComponent,
    PointsPage,
    PointsDetailPage,
    PopoverOptionsPage,
    LightboxPage,
    EstablishmentListPage,
    EstablishmentListDetailPage,
    MenuByEstablishmentPage,
    ItemCardEstablishmentComponent,
    ItemDetailEstablishmentPage,
    AdditionsEstablishmentPage,
    ScanCodePage
];