import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Locale = "en" | "fr";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.browse": "Browse",
  "nav.requests": "Requests",
  "nav.opportunities": "Opportunities",
  "nav.upload": "Upload",
  "nav.login": "Login",
  "nav.logout": "Sign Out",
  "nav.profile": "My Profile",
  "nav.settings": "Settings",
  "nav.language": "Language",
  "auth.signout.title": "Sign out?",
  "auth.signout.desc": "Are you sure you want to sign out? Your bookmarks will be saved.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signin": "Sign in",
  "auth.signup": "Sign up",
  "auth.forgot": "Forgot password?",
  "auth.noaccount": "Don't have an account?",
  "auth.hasaccount": "Already have an account?",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.search": "Search",
  "common.loading": "Loading…",
  "common.error": "Something went wrong",
  "common.retry": "Retry",
  "common.delete": "Delete",
  "common.reply": "Reply",
  "common.post": "Post",
  "hero.badge": "10,000+ documents shared across Rwanda",
  "hero.title.a": "Your Academic Resources,",
  "hero.title.b": "All in One Hub",
  "hero.subtitle": "Access past exams, notes, and study materials from universities across Rwanda. Share knowledge, earn points, and excel together.",
  "hero.search.placeholder": "Search by course code, title, or keyword...",
  "hero.search.button": "Search",
  "hero.popular": "Popular:",
  "footer.rights": "All rights reserved.",
  "footer.tagline": "Built by students, for students.",
  "browse.filters": "Filters",
  "browse.sort": "Sort",
  "browse.empty": "No documents match your filters yet.",
  "comments.title": "Comments",
  "comments.placeholder": "Share your thoughts about this document...",
  "comments.signin": "Sign in to join the discussion.",
  "comments.first": "Be the first to comment.",
};

const fr: Dict = {
  "nav.browse": "Parcourir",
  "nav.requests": "Demandes",
  "nav.opportunities": "Opportunités",
  "nav.upload": "Téléverser",
  "nav.login": "Connexion",
  "nav.logout": "Déconnexion",
  "nav.profile": "Mon profil",
  "nav.settings": "Paramètres",
  "nav.language": "Langue",
  "auth.signout.title": "Se déconnecter ?",
  "auth.signout.desc": "Voulez-vous vraiment vous déconnecter ? Vos crédits et favoris seront conservés.",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.signin": "Se connecter",
  "auth.signup": "S'inscrire",
  "auth.forgot": "Mot de passe oublié ?",
  "auth.noaccount": "Pas encore de compte ?",
  "auth.hasaccount": "Vous avez déjà un compte ?",
  "common.cancel": "Annuler",
  "common.save": "Enregistrer",
  "common.search": "Rechercher",
  "common.loading": "Chargement…",
  "common.error": "Une erreur est survenue",
  "common.retry": "Réessayer",
  "common.delete": "Supprimer",
  "common.reply": "Répondre",
  "common.post": "Publier",
  "hero.badge": "Plus de 10 000 documents partagés au Rwanda",
  "hero.title.a": "Vos ressources académiques,",
  "hero.title.b": "Toutes au même endroit",
  "hero.subtitle": "Accédez aux examens, notes et supports d'étude des universités du Rwanda. Partagez vos connaissances, gagnez des points et réussissez ensemble.",
  "hero.search.placeholder": "Rechercher par code de cours, titre ou mot-clé...",
  "hero.search.button": "Rechercher",
  "hero.popular": "Populaire :",
  "footer.rights": "Tous droits réservés.",
  "footer.tagline": "Conçu par des étudiants, pour les étudiants.",
  "browse.filters": "Filtres",
  "browse.sort": "Trier",
  "browse.empty": "Aucun document ne correspond à vos filtres.",
  "comments.title": "Commentaires",
  "comments.placeholder": "Partagez votre avis sur ce document...",
  "comments.signin": "Connectez-vous pour rejoindre la discussion.",
  "comments.first": "Soyez le premier à commenter.",
};

const dicts: Record<Locale, Dict> = { en, fr };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "unihub_locale";

function detectInitial(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved && dicts[saved]) return saved;
  const nav = navigator.language?.toLowerCase() || "";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitial);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, fallback) => dicts[locale][key] ?? dicts.en[key] ?? fallback ?? key,
    }),
    [locale]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback so components don't crash if provider missing
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string, fallback?: string) => dicts.en[key] ?? fallback ?? key,
    };
  }
  return ctx;
}
