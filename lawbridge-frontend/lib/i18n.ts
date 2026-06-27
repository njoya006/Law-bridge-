'use client'

export type Lang = 'en' | 'fr'

const TRANSLATIONS = {
  en: {
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure your preferences and account security',
    'settings.tabs.notifications': 'Notifications',
    'settings.tabs.language': 'Language & Locale',
    'settings.tabs.communication': 'Communication',
    'settings.tabs.privacy': 'Privacy',
    'settings.tabs.security': 'Security',
    'settings.save': 'Save Changes',
    'settings.saving': 'Saving…',
    'settings.saved': 'Saved.',
    'settings.notifications.title': 'Notification Preferences',
    'settings.notifications.subtitle': 'Choose which events send you a notification.',
    'settings.notifications.case_updates': 'Case Updates',
    'settings.notifications.case_updates.desc': 'When your case status changes or a lawyer posts an update',
    'settings.notifications.documents': 'Document Activity',
    'settings.notifications.documents.desc': 'When a document is uploaded, signed, or shared with you',
    'settings.notifications.messages': 'Messages',
    'settings.notifications.messages.desc': 'When you receive a new message from your lawyer',
    'settings.notifications.billing': 'Billing & Payments',
    'settings.notifications.billing.desc': 'Invoice issued, payment received, or payment due reminders',
    'settings.notifications.reminders': 'Reminders',
    'settings.notifications.reminders.desc': 'Court dates, deadlines, and scheduled appointments',
    'settings.language.title': 'Language & Locale',
    'settings.language.subtitle': 'Set your preferred language for the platform interface and documents.',
    'settings.language.platform': 'Platform Language',
    'settings.language.platform.desc': 'The language used throughout the Lawbridge interface',
    'settings.language.note': 'Your language preference is saved to your account and shared with your lawyer. Full French interface translation will be applied automatically.',
    'settings.communication.title': 'Communication Preferences',
    'settings.communication.subtitle': 'How you prefer your lawyer and the platform to reach you.',
    'settings.communication.contact': 'Preferred Contact Method',
    'settings.communication.contact.desc': 'Your lawyer will be informed of this preference',
    'settings.communication.email': 'Email',
    'settings.communication.phone': 'Phone Call',
    'settings.communication.inapp': 'In-App Messaging Only',
    'settings.privacy.title': 'Privacy',
    'settings.privacy.subtitle': 'Control what information is visible to lawyers and the public.',
    'settings.privacy.visibility': 'Profile Visibility',
    'settings.privacy.visibility.desc': 'Allow lawyers and the platform to see your profile information',
    'settings.security.title': 'Change Password',
    'settings.security.subtitle': 'Use a strong password — at least 8 characters with a mix of letters and numbers.',
    'settings.security.current': 'Current Password',
    'settings.security.new': 'New Password',
    'settings.security.confirm': 'Confirm New Password',
    'settings.security.submit': 'Change Password',
    'settings.security.2fa.title': 'Two-Factor Authentication',
    'settings.security.2fa.desc': 'Add an extra layer of security to your account with 2FA.',
    'settings.security.2fa.enable': 'Enable 2FA',
    // Profile
    'profile.title': 'Client Account',
    'profile.subtitle': 'Manage your matters, documents, and contact details',
    'profile.edit': 'Edit Account',
    'profile.save': 'Save Changes',
    'profile.cancel': 'Cancel',
    'profile.account_type': 'Client Account',
  },
  fr: {
    // Settings
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Configurez vos préférences et la sécurité de votre compte',
    'settings.tabs.notifications': 'Notifications',
    'settings.tabs.language': 'Langue et région',
    'settings.tabs.communication': 'Communication',
    'settings.tabs.privacy': 'Confidentialité',
    'settings.tabs.security': 'Sécurité',
    'settings.save': 'Enregistrer',
    'settings.saving': 'Enregistrement…',
    'settings.saved': 'Enregistré.',
    'settings.notifications.title': 'Préférences de notification',
    'settings.notifications.subtitle': 'Choisissez les événements qui vous envoient une notification.',
    'settings.notifications.case_updates': 'Mises à jour des dossiers',
    'settings.notifications.case_updates.desc': "Quand le statut de votre dossier change ou qu'un avocat publie une mise à jour",
    'settings.notifications.documents': 'Activité documentaire',
    'settings.notifications.documents.desc': "Quand un document est téléchargé, signé ou partagé avec vous",
    'settings.notifications.messages': 'Messages',
    'settings.notifications.messages.desc': 'Quand vous recevez un nouveau message de votre avocat',
    'settings.notifications.billing': 'Facturation et paiements',
    'settings.notifications.billing.desc': 'Facture émise, paiement reçu ou rappels de paiement',
    'settings.notifications.reminders': 'Rappels',
    'settings.notifications.reminders.desc': 'Dates d\'audience, délais et rendez-vous planifiés',
    'settings.language.title': 'Langue et région',
    'settings.language.subtitle': 'Définissez votre langue préférée pour l\'interface et les documents.',
    'settings.language.platform': 'Langue de la plateforme',
    'settings.language.platform.desc': 'La langue utilisée dans toute l\'interface Lawbridge',
    'settings.language.note': 'Votre préférence de langue est sauvegardée sur votre compte et partagée avec votre avocat.',
    'settings.communication.title': 'Préférences de communication',
    'settings.communication.subtitle': 'Comment vous préférez que votre avocat et la plateforme vous contactent.',
    'settings.communication.contact': 'Mode de contact préféré',
    'settings.communication.contact.desc': 'Votre avocat sera informé de cette préférence',
    'settings.communication.email': 'E-mail',
    'settings.communication.phone': 'Appel téléphonique',
    'settings.communication.inapp': 'Messagerie in-app uniquement',
    'settings.privacy.title': 'Confidentialité',
    'settings.privacy.subtitle': 'Contrôlez les informations visibles par les avocats et le public.',
    'settings.privacy.visibility': 'Visibilité du profil',
    'settings.privacy.visibility.desc': 'Autoriser les avocats et la plateforme à consulter vos informations',
    'settings.security.title': 'Changer le mot de passe',
    'settings.security.subtitle': 'Utilisez un mot de passe fort — au moins 8 caractères.',
    'settings.security.current': 'Mot de passe actuel',
    'settings.security.new': 'Nouveau mot de passe',
    'settings.security.confirm': 'Confirmer le nouveau mot de passe',
    'settings.security.submit': 'Changer le mot de passe',
    'settings.security.2fa.title': 'Authentification à deux facteurs',
    'settings.security.2fa.desc': 'Ajoutez une couche de sécurité supplémentaire avec la 2FA.',
    'settings.security.2fa.enable': 'Activer la 2FA',
    // Profile
    'profile.title': 'Compte client',
    'profile.subtitle': 'Gérez vos dossiers, documents et coordonnées',
    'profile.edit': 'Modifier le compte',
    'profile.save': 'Enregistrer',
    'profile.cancel': 'Annuler',
    'profile.account_type': 'Compte client',
  },
} as const

type TranslationKey = keyof typeof TRANSLATIONS['en']

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('lang') as Lang) || 'en'
}

export function setLang(lang: Lang) {
  if (typeof window === 'undefined') return
  localStorage.setItem('lang', lang)
  window.dispatchEvent(new CustomEvent('lawbridge:lang-changed', { detail: { lang } }))
}

export function t(key: TranslationKey, lang?: Lang): string {
  const l = lang ?? getLang()
  return (TRANSLATIONS[l] as Record<string, string>)[key] ?? (TRANSLATIONS['en'] as Record<string, string>)[key] ?? key
}
