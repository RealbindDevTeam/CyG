import { EmailContent } from '../../../../both/models/general/email-content.model';
import { EmailContents } from '../../../../both/collections/general/email-content.collection';

export function loadEmailContents() {
    if (EmailContents.find().cursor.count() === 0) {
        const emailContents: EmailContent[] = [
            {
                _id: '100',
                language: 'en',
                lang_dictionary: [
                    { label: 'chargeSoonEmailSubjectVar', traduction: 'Your monthly comeygana service will ends soon' },
                    { label: 'greetVar', traduction: 'Hello' },
                    { label: 'welcomeMsgVar', traduction: 'We got a request to reset you password, if it was you click the button above.' },
                    { label: 'btnTextVar', traduction: 'Reset' },
                    { label: 'beforeMsgVar', traduction: 'If you do not want to change the password, ignore this message.' },
                    { label: 'regardVar', traduction: 'Thanks, comeygana team.' },
                    { label: 'followMsgVar', traduction: 'Follow us on social networks' },
                    { label: 'reminderChargeSoonMsgVar', traduction: 'Remember that your monthly comeygana service for: ' },
                    { label: 'reminderChargeSoonMsgVar2', traduction: 'Ends on: ' },
                    { label: 'instructionchargeSoonMsgVar', traduction: 'If you want to continue using all the system features, entering with your email or username and select the menu Establishments > Administration > Edit establishment > # Tables' },
                    { label: 'reminderExpireSoonMsgVar', traduction: 'Remember that your monthly comeygana service for: ' },
                    { label: 'reminderExpireSoonMsgVar2', traduction: 'Expires on: ' },
                    { label: 'reminderExpireSoonMsgVar3', traduction: 'If you want to continue using all the system features, entering with your email or username and select the menu Payments > Monthly payment' },
                    { label: 'expireSoonEmailSubjectVar', traduction: 'Your comeygana service will expire soon' },
                    { label: 'reminderRestExpiredVar', traduction: 'Your monthly comeygana service for: ' },
                    { label: 'reminderRestExpiredVar2', traduction: 'Has expired' },
                    { label: 'reminderRestExpiredVar3', traduction: 'If you want to continue using all the system features, entering with your email or username and select the menu Payments > Reactivate ' },
                    { label: 'restExpiredEmailSubjectVar', traduction: 'Your comeygana service has expired' },
                    { label: 'resetPasswordSubjectVar', traduction: 'Reset your password on' },
                    { label: 'reminderCurrentMedals1', traduction: 'Soon you will finish your medals for ' },
                    { label: 'reminderCurrentMedals2', traduction: 'You only have ' },
                    { label: 'reminderCurrentMedals3', traduction: ' medals' },
                    { label: 'reminderCurrentMedals4', traduction: 'Select the menu Packages > Buy packages and continues loyalty your customers with comeygana' },
                    { label: 'checkMedalsSubjectVar', traduction: 'Your medals will end soon' },
                    { label: 'reminderNegativeMedals1', traduction: 'You have finished your medals for ' },
                    { label: 'reminderNegativeMedals2', traduction: 'But do not worry, we have lent you ' },
                    { label: 'reminderNegativeMedals3', traduction: 'medals while you buy a new package' },
                    { label: 'reminderNegativeMedals4', traduction: 'To buy a new package select the menu Packages > Buy packages and continues loyalty your customers with comeygana' },
                    { label: 'checkNegativeSubjectVar', traduction: 'Your medals are over' }
                ]
            },
            {
                _id: '200',
                language: 'es',
                lang_dictionary: [
                    { label: 'chargeSoonEmailSubjectVar', traduction: 'Tu servicio mensual de comeygana terminará pronto' },
                    { label: 'greetVar', traduction: 'Hola' },
                    { label: 'welcomeMsgVar', traduction: 'Hemos recibido una petición para cambiar tu contraseña, si fuiste tu haz click en el botón abajo' },
                    { label: 'btnTextVar', traduction: 'Cambiar' },
                    { label: 'beforeMsgVar', traduction: 'Si no quieres cambiar la contraseña, ignora este mensaje.' },
                    { label: 'regardVar', traduction: 'Gracias, equipo comeygana' },
                    { label: 'followMsgVar', traduction: 'Siguenos en redes sociales' },
                    { label: 'reminderChargeSoonMsgVar', traduction: 'Recuerda que tu servicio mensual de comeygana para: ' },
                    { label: 'reminderChargeSoonMsgVar2', traduction: 'Finaliza el: ' },
                    { label: 'instructionchargeSoonMsgVar', traduction: 'Si deseas seguir usando todas las funcionalidades del sistema, ingresa con tu usuario o correo y selecciona el menú Establecimientos > Administración > Editar establecimiento > # Mesas' },
                    { label: 'reminderExpireSoonMsgVar', traduction: 'Recuerda que tu servicio mensual de comeygana para: ' },
                    { label: 'reminderExpireSoonMsgVar2', traduction: 'Expira el: ' },
                    { label: 'reminderExpireSoonMsgVar3', traduction: 'Si deseas seguir usando todas las funcionalidades del sistema, ingresa con tu usuario o correo y selecciona el menú Pagos > Pago mensual' },
                    { label: 'expireSoonEmailSubjectVar', traduction: 'Tu servicio comeygana expirará pronto' },
                    { label: 'reminderRestExpiredVar', traduction: 'Tu servicio mensual de comeygana para: ' },
                    { label: 'reminderRestExpiredVar2', traduction: 'ha expirado' },
                    { label: 'reminderRestExpiredVar3', traduction: 'Si deseas seguir usando todas las funcionalidades del sistema, ingresa con tu usuario o correo y selecciona la opción Pagos > Reactivar ' },
                    { label: 'restExpiredEmailSubjectVar', traduction: 'Tu servicio de comeygana ha expirado' },
                    { label: 'resetPasswordSubjectVar', traduction: 'Cambio de contraseña en' },
                    { label: 'reminderCurrentMedals1', traduction: 'Pronto terminarás tus medallas para ' },
                    { label: 'reminderCurrentMedals2', traduction: 'Únicamente tienes ' },
                    { label: 'reminderCurrentMedals3', traduction: ' medallas' },
                    { label: 'reminderCurrentMedals4', traduction: 'Selecciona el menú Paquetes > Compra de paquetes, y continua fidelizando a tus clientes con comeygana' },
                    { label: 'checkMedalsSubjectVar', traduction: 'Tus medallas comeygana están próximas a terminar' },
                    { label: 'reminderNegativeMedals1', traduction: 'Has terminado las medallas para ' },
                    { label: 'reminderNegativeMedals2', traduction: 'Pero no te preocupes te préstamos las ' },
                    { label: 'reminderNegativeMedals3', traduction: 'medallas que has usado, mientras adquieres un nuevo paquete' },
                    { label: 'reminderNegativeMedals4', traduction: 'Para comprar un nuevo paquete selecciona el menu Paquetes > Compra de paquetes, y continua fidelizando tu cliente con comeygana' },
                    { label: 'checkNegativeSubjectVar', traduction: 'Tus medallas se han acabado' }
                ]
            }
        ];
        emailContents.forEach((emailContent: EmailContent) => EmailContents.insert(emailContent));
    }
}