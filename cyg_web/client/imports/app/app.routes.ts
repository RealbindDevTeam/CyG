import { Route } from '@angular/router';
import { LayoutComponent } from './web/navigation/layout/layout.component';
import { RouteGuard } from './web/services/navigation/route-guard.service';
import { CustomerGuard } from './web/services/navigation/customer-guard.service';
import { AdminGuard } from './web/services/navigation/admin-guard.service';
import { SupervisorGuard } from './web/services/navigation/supervisor-guard.service';
import { DashboardComponent } from './web/administrator/dashboard/dashboard.component';
import { SectionComponent } from './web/administrator/menu/sections/section/section.component';
import { SigninWebComponent } from './web/auth/signin/signin.web.component';
import { CategoryComponent } from './web/administrator/menu/categories/categories/categories.component';
import { SubcategoryComponent } from './web/administrator/menu/subcategories/subcategories/subcategories.component';
//import { TableComponent } from './web/administrator/administration/tables/table/table.component';
import { EstablishmentRegisterComponent } from './web/administrator/administration/establishment/register/establishment-register.component';
import { SettingsWebComponent } from './web/settings/settings/settings.web.component';
import { EstablishmentComponent } from './web/administrator/administration/establishment/establishment/establishment.component';
import { ItemCreationComponent } from './web/administrator/menu/items/creation/item-creation.component';
import { ItemEditionComponent } from './web/administrator/menu/items/edition/item-edition.component';
import { ResetPasswordWebComponent } from './web/auth/reset-password/reset-password.web.component';
import { GoToStoreComponent } from './web/auth/go-to-store/go-to-store.component';
import { CollaboratorsComponent } from './web/administrator/administration/collaborators/collaborators/collaborators.component';
import { CollaboratorsRegisterComponent } from './web/administrator/administration/collaborators/register/collaborators-register.component';
import { ItemComponent } from './web/administrator/menu/items/item/item.component';
import { EstablishmentEditionComponent } from './web/administrator/administration/establishment/edition/establishment-edition.component';
import { NotFoundWebComponent } from './web/auth/notfound/notfound.web.component';
import { SupervisorDashboardComponent } from './web/supervisor/dashboard/supervisor-dashboard.component';
//import { PayuPaymentFormComponent } from './web/administrator/payment/payu-payment-form/payu-payment-form.component';
import { PaymentHistoryComponent } from './web/administrator/payment/payment-history/payment-history.component';
//import { TrnResponseConfirmComponent } from './web/administrator/payment/payu-payment-form/transaction-response-confirm/trn-response-confirm.component';
import { AdminSignupComponent } from './web/auth/admin-signup/admin-signup.component';
//import { ItemEnableSupComponent } from './web/supervisor/items-enable/items-enable-sup.component';
//import { SupervisorTableComponent } from './web/supervisor/tables/supervisor-tables.component';
//import { EstablishmentTableControlComponent } from './web/administrator/administration/tables/table-control/establishment-table-control.component';
import { TableDetailComponent } from './web/administrator/administration/tables/table-control/table-detail/table-detail.component';
//import { SupervisorEstablishmentTableControlComponent } from './web/supervisor/establishment-table-control/supervisor-establishment-table-control.component';
import { EstablishmentProfileComponent } from './web/administrator/administration/establishment/profile/establishment-profile.component';
import { RewardComponent } from './web/administrator/rewards/reward/reward.component';
import { RewardUnitsChartComponent } from 'client/imports/app/web/administrator/dashboard/reward-units-chart/reward-units-chart.component';
import { RewardHistoryChartComponent } from './web/administrator/dashboard/reward-history-chart/reward-history-chart.component';
//import { EstablishmentListComponent } from './web/administrator/administration/establishment/monthly-config/establishment-list/establishment-list.component';
import { EnableDisableComponent } from './web/administrator/administration/establishment/monthly-config/enable-disable/enable-disable.component';
import { BagsPaymentComponent } from './web/administrator/payment/bags-payment/bags-payment.component';
import { PaymentFormComponent } from './web/administrator/payment/payment-form/payment-form.component';
import { ApproveRewardsComponent } from './web/administrator/approve-rewards/approve-rewards.component';
import { SupervisorApproveRewardsComponent } from "./web/supervisor/approve-rewards/supervisor-approve-rewards.component";
import { GiveMedalComponent } from './web/administrator/give-medal/give-medal.component';
import { SupervisorGiveMedalComponent } from './web/supervisor/give-medal/supervisor-give-medal.component';

export const routes: Route[] = [
    {
        path: 'app', component: LayoutComponent, canActivateChild: [RouteGuard], children: [
            { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
            { path: 'settings', component: SettingsWebComponent },
            { path: 'collaborators', component: CollaboratorsComponent, canActivate: [SupervisorGuard] },
            { path: 'collaborators-register', component: CollaboratorsRegisterComponent, canActivate: [SupervisorGuard] },
            { path: 'sections', component: SectionComponent, canActivate: [AdminGuard] },
            { path: 'categories', component: CategoryComponent, canActivate: [AdminGuard] },
            { path: 'subcategories', component: SubcategoryComponent, canActivate: [AdminGuard] },
            { path: 'items', component: ItemComponent, canActivate: [AdminGuard] },
            { path: 'items-creation', component: ItemCreationComponent, canActivate: [AdminGuard] },
            { path: 'items-edition/:param1', component: ItemEditionComponent, canActivate: [AdminGuard] },
            { path: 'establishment', component: EstablishmentComponent, canActivate: [AdminGuard] },
            { path: 'establishment-register', component: EstablishmentRegisterComponent, canActivate: [AdminGuard] },
            { path: 'establishment-edition/:param1', component: EstablishmentEditionComponent, canActivate: [AdminGuard] },
            //{ path: 'tables', component: TableComponent, canActivate: [AdminGuard] },
            { path: 'dashboards', component: SupervisorDashboardComponent, canActivate: [SupervisorGuard] },
            //{ path: 'establishment-list', component: EstablishmentListComponent, canActivate: [AdminGuard] },
            { path: 'enable-disable/:param1', component: EnableDisableComponent, canActivate: [AdminGuard] },
            //{ path: 'payu-payment-form/:param1/:param2/:param3', component: PayuPaymentFormComponent, canActivate: [AdminGuard] },
            { path: 'payment-history', component: PaymentHistoryComponent, canActivate: [AdminGuard] },
            { path: 'table-detail/:param1/:param2/:param3/:param4/:param5', component: TableDetailComponent, canActivate: [SupervisorGuard] },
            //{ path: 'supervisor-establishment-table-control', component: SupervisorEstablishmentTableControlComponent, canActivate: [SupervisorGuard] },
            { path: 'establishment-profile', component: EstablishmentProfileComponent, canActivate: [AdminGuard] },
            { path: 'rewards', component: RewardComponent, canActivate: [AdminGuard] },
            { path: 'reward-units-chart/:param1', component: RewardUnitsChartComponent, canActivate: [AdminGuard] },
            { path: 'supervisor-reward-units-chart/:param1', component: RewardUnitsChartComponent, canActivate: [SupervisorGuard] },
            { path: 'reward-history-chart/:param1', component: RewardHistoryChartComponent, canActivate: [AdminGuard] },
            { path: 'supervisor-reward-history-chart/:param1', component: RewardHistoryChartComponent, canActivate: [SupervisorGuard] },
            { path: 'reward-history-chart/:param1', component: RewardHistoryChartComponent, canActivate: [AdminGuard] },
            { path: 'bags-payment', component: BagsPaymentComponent, canActivate: [AdminGuard] },
            { path: 'payment-form', component: PaymentFormComponent, canActivate: [AdminGuard] },
            { path: 'approve-rewards', component: ApproveRewardsComponent, canActivate: [AdminGuard] },
            { path: 'supervisor-approve-rewards', component: SupervisorApproveRewardsComponent, canActivate: [SupervisorGuard] },
            { path: 'give-medals', component: GiveMedalComponent, canActivate: [AdminGuard] },
            { path: 'supervisor-give-medals', component: SupervisorGiveMedalComponent, canActivate: [SupervisorGuard] },
        ]
    },
    { path: '', component: SigninWebComponent },
    { path: 'admin-signup', component: AdminSignupComponent },
    { path: 'reset-password/:tk', component: ResetPasswordWebComponent },
    { path: 'go-to-store/:ic', component: GoToStoreComponent },
    { path: '404', component: NotFoundWebComponent },
    { path: '**', redirectTo: '/404' }
];
