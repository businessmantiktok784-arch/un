import AsyncStorage from '@react-native-async-storage/async-storage';

export type Locale = 'en' | 'fr';

const STORAGE_KEY = 'unihub_locale';

type Dict = Record<string, string>;

const en: Dict = {
  'nav.browse': 'Browse',
  'nav.requests': 'Requests',
  'nav.opportunities': 'Opportunities',
  'nav.upload': 'Upload',
  'nav.login': 'Sign In',
  'nav.logout': 'Sign Out',
  'nav.profile': 'My Profile',
  'nav.settings': 'Settings',
  'nav.language': 'Language',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.search': 'Search',
  'common.loading': 'Loading…',
  'common.error': 'Something went wrong',
  'common.retry': 'Retry',
  'common.delete': 'Delete',
  'common.reply': 'Reply',
  'common.post': 'Post',
  'browse.filters': 'Filters',
  'browse.sort': 'Sort',
  'browse.empty': 'No documents match your filters yet.',
  'comments.title': 'Comments',
  'comments.placeholder': 'Share your thoughts about this document…',
  'comments.signin': 'Sign in to join the discussion.',
  'comments.first': 'Be the first to comment.',
  'requests.title': 'Requests',
  'requests.new': 'New',
  'requests.signin': 'Sign in required',
  'requests.signin.desc': 'Sign in to request documents from your university',
  'requests.empty': 'No requests',
  'requests.empty.desc': 'Tap "New" to request a document',
  'opportunities.title': 'Opportunities',
  'opportunities.empty': 'No opportunities found',
  'browse.title': 'Browse',
  'browse.search': 'Search documents…',
  'browse.empty.desc': 'Try adjusting your search or filters',
  'upload.title': 'Upload',
  'upload.submit': 'Submit Document',
  'history.title': 'History',
  'history.empty': 'No history yet',
  'bookmarks.title': 'Bookmarks',
  'bookmarks.empty': 'No bookmarks yet',
  'settings.title': 'Settings',
  'help.title': 'Help',
  'about.title': 'About',
  'contact.title': 'Contact Us',
  'terms.title': 'Terms of Service',
  'privacy.title': 'Privacy Policy',
  'copyright.title': 'Document Copyright',
  'onboarding.title': 'Complete Your Profile',
};

const fr: Dict = {
  'nav.browse': 'Parcourir',
  'nav.requests': 'Demandes',
  'nav.opportunities': 'Opportunités',
  'nav.upload': 'Téléverser',
  'nav.login': 'Connexion',
  'nav.logout': 'Déconnexion',
  'nav.profile': 'Mon profil',
  'nav.settings': 'Paramètres',
  'nav.language': 'Langue',
  'common.cancel': 'Annuler',
  'common.save': 'Enregistrer',
  'common.search': 'Rechercher',
  'common.loading': 'Chargement…',
  'common.error': 'Une erreur est survenue',
  'common.retry': 'Réessayer',
  'common.delete': 'Supprimer',
  'common.reply': 'Répondre',
  'common.post': 'Publier',
  'browse.filters': 'Filtres',
  'browse.sort': 'Trier',
  'browse.empty': 'Aucun document ne correspond à vos filtres.',
  'comments.title': 'Commentaires',
  'comments.placeholder': 'Partagez votre avis sur ce document…',
  'comments.signin': 'Connectez-vous pour rejoindre la discussion.',
  'comments.first': 'Soyez le premier à commenter.',
  'requests.title': 'Demandes',
  'requests.new': 'Nouveau',
  'requests.signin': 'Connexion requise',
  'requests.signin.desc': 'Connectez-vous pour demander des documents de votre université',
  'requests.empty': 'Aucune demande',
  'requests.empty.desc': 'Appuyez sur "Nouveau" pour demander un document',
  'opportunities.title': 'Opportunités',
  'opportunities.empty': 'Aucune opportunité trouvée',
  'browse.title': 'Parcourir',
  'browse.search': 'Rechercher des documents…',
  'browse.empty.desc': 'Essayez d\'ajuster votre recherche ou vos filtres',
  'upload.title': 'Téléverser',
  'upload.submit': 'Soumettre le document',
  'history.title': 'Historique',
  'history.empty': 'Pas encore d\'historique',
  'bookmarks.title': 'Favoris',
  'bookmarks.empty': 'Pas encore de favoris',
  'settings.title': 'Paramètres',
  'help.title': 'Aide',
  'about.title': 'À propos',
  'contact.title': 'Contactez-nous',
  'terms.title': "Conditions d'utilisation",
  'privacy.title': 'Politique de confidentialité',
  'copyright.title': 'Droits d\'auteur',
  'onboarding.title': 'Complétez votre profil',
};

// Kinyarwanda removed - only English and French supported
const placeholder: Dict = {
  'nav.browse': 'Shakisha',
  'nav.requests': 'Ibyifuzo',
  'nav.opportunities': 'Amahirwe',
  'nav.upload': 'Ohereza',
  'nav.login': 'Injira',
  'nav.logout': 'Sohoka',
  'nav.profile': 'Konti yanjye',
  'nav.settings': 'Igenamiterere',
  'nav.language': 'Ururimi',
  'common.cancel': 'Hagarika',
  'common.save': 'Bika',
  'common.search': 'Shakisha',
  'common.loading': 'Birimo gupakirwa…',
  'common.error': 'Hari ikibazo cyabaye',
  'common.retry': 'Ongera ugerageze',
  'common.delete': 'Siba',
  'common.reply': 'Subiza',
  'common.post': 'Ohereza',
  'browse.filters': 'Sosora',
  'browse.sort': 'Tondeka',
  'browse.empty': 'Nta nyandiko ihuye n\'ibyo washatse.',
  'comments.title': 'Ibitekerezo',
  'comments.placeholder': 'Tanga igitekerezo cyawe kuri iyi nyandiko…',
  'comments.signin': 'Injira kugira ngo wifatanye n\'ibiganiro.',
  'comments.first': 'Ba uwa mbere utanga igitekerezo.',
  'requests.title': 'Ibyifuzo',
  'requests.new': 'Gishya',
  'requests.signin': 'Injira mbere',
  'requests.signin.desc': 'Injira kugira ngo usabe inyandiko za kaminuza yawe',
  'requests.empty': 'Nta byifuzo',
  'requests.empty.desc': 'Kanda "Gishya" kugira ngo usabe inyandiko',
  'opportunities.title': 'Amahirwe',
  'opportunities.empty': 'Nta mahirwe abonetse',
  'browse.title': 'Shakisha',
  'browse.search': 'Shakisha inyandiko…',
  'browse.empty.desc': 'Gerageza guhindura ubushakashatsi bwawe',
  'upload.title': 'Ohereza',
  'upload.submit': 'Tanga inyandiko',
  'history.title': 'Amateka',
  'history.empty': 'Nta mateka yabonetse',
  'bookmarks.title': 'Ibimarkwa',
  'bookmarks.empty': 'Nta bimarkwa byabonetse',
  'settings.title': 'Igenamiterere',
  'help.title': 'Ubufasha',
  'about.title': 'Ibyerekeye',
  'contact.title': 'Twandikire',
  'terms.title': 'Amategeko y\'ikoreshwa',
  'privacy.title': 'Politiki y\'ibanga',
  'copyright.title': 'Uburenganzira bw\'inyandiko',
  'onboarding.title': 'Uzuza profil yawe',
};

const dicts: Record<Locale, Dict> = { en, fr };

export function t(locale: Locale, key: string, fallback?: string): string {
  return dicts[locale][key] ?? dicts.en[key] ?? fallback ?? key;
}

export async function loadLocale(): Promise<Locale> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') return saved;
  } catch {}
  return 'en';
}

export async function saveLocale(locale: Locale): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, locale);
}

export const LOCALES = [
  { code: 'en' as Locale, label: 'English' },
  { code: 'fr' as Locale, label: 'Français' },
];
