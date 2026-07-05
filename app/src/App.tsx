import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreditProvider } from "@/contexts/CreditContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import BackToTop from "@/components/BackToTop";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import CookieConsent from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageViewTracker from "@/components/PageViewTracker";
import { I18nProvider } from "@/lib/i18n";
import Index from "./pages/Index";

// Lazy-loaded routes
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const DocumentDetailPage = lazy(() => import("./pages/DocumentDetailPage"));
const RequestsPage = lazy(() => import("./pages/RequestsPage"));
const UniversityDetailPage = lazy(() => import("./pages/UniversityDetailPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const CopyrightPage = lazy(() => import("./pages/CopyrightPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));

const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Admin
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminDocumentsPage = lazy(() => import("./pages/admin/AdminDocumentsPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminCoursesPage = lazy(() => import("./pages/admin/AdminCoursesPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminContributorsPage = lazy(() => import("./pages/admin/AdminContributorsPage"));
const AdminMonitoringPage = lazy(() => import("./pages/admin/AdminMonitoringPage"));

const AdminUniversitiesPage = lazy(() => import("./pages/admin/AdminUniversitiesPage"));
const AdminOpportunitiesPage = lazy(() => import("./pages/admin/AdminOpportunitiesPage"));
const AdminTestimonialsPage = lazy(() => import("./pages/admin/AdminTestimonialsPage"));
const AdminBrowsePage = lazy(() => import("./pages/admin/AdminBrowsePage"));
const AdminContactPage = lazy(() => import("./pages/admin/AdminContactPage"));
const AdminSupportPage = lazy(() => import("./pages/admin/AdminSupportPage"));
const AdminAuditLogPage = lazy(() => import("./pages/admin/AdminAuditLogPage"));
const AdminProfilePage = lazy(() => import("./pages/admin/AdminProfilePage"));

// New RBAC Admin Pages
const AdminStaffPage = lazy(() => import("./pages/admin/AdminStaffPage"));
const AdminOrganizationsPage = lazy(() => import("./pages/admin/AdminOrganizationsPage"));
const AdminAdsPage = lazy(() => import("./pages/admin/AdminAdsPage"));

const queryClient = new QueryClient();

const PageWithSidebar = ({ children }: { children: React.ReactNode }) => (
  <div className="pt-16 pb-14 md:pb-0">
    {children}
    <MobileBottomNav />
    <BackToTop />
    <AccessibilityToolbar />
  </div>
);

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <CreditProvider>
            <NotificationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PageViewTracker />
                <CookieConsent />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    {/* Admin (RBAC-gated inside AdminLayout) */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminOverview />} />
                      <Route path="analytics" element={<AdminAnalyticsPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="documents" element={<AdminDocumentsPage />} />
                      <Route path="reports" element={<AdminReportsPage />} />
                      <Route path="courses" element={<AdminCoursesPage />} />
                      <Route path="contributors" element={<AdminContributorsPage />} />
                      <Route path="monitoring" element={<AdminMonitoringPage />} />
                      <Route path="notifications" element={<AdminNotificationsPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                      <Route path="universities" element={<AdminUniversitiesPage />} />
                      <Route path="opportunities" element={<AdminOpportunitiesPage />} />
                      <Route path="testimonials" element={<AdminTestimonialsPage />} />
                      <Route path="browse" element={<AdminBrowsePage />} />
                      <Route path="contact" element={<AdminContactPage />} />
                      <Route path="support" element={<AdminSupportPage />} />
                      <Route path="audit" element={<AdminAuditLogPage />} />
                      <Route path="profile" element={<AdminProfilePage />} />
                      {/* New RBAC Pages */}
                      <Route path="staff" element={<AdminStaffPage />} />
                      <Route path="organizations" element={<AdminOrganizationsPage />} />
                      <Route path="ads" element={<AdminAdsPage />} />
                    </Route>

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />

                    {/* Public */}
                    <Route path="/" element={<PageWithSidebar><Index /></PageWithSidebar>} />
                    {[
                      { path: "/browse", element: <BrowsePage /> },
                      { path: "/document/:id", element: <DocumentDetailPage /> },
                      { path: "/upload", element: <UploadPage /> },
                      { path: "/requests", element: <RequestsPage /> },
                      { path: "/opportunities", element: <OpportunitiesPage /> },
                      { path: "/university/:id", element: <UniversityDetailPage /> },
                      { path: "/bookmarks", element: <BookmarksPage /> },
                      { path: "/history", element: <HistoryPage /> },
                      { path: "/settings", element: <SettingsPage /> },
                      { path: "/terms", element: <TermsPage /> },
                      { path: "/privacy", element: <PrivacyPage /> },
                      { path: "/copyright", element: <CopyrightPage /> },
                      { path: "/about", element: <AboutPage /> },
                      { path: "/contact", element: <ContactPage /> },
                      { path: "/help", element: <HelpPage /> },
                    ].map(({ path, element }) => (
                      <Route key={path} path={path} element={
                        <PageWithSidebar>{element}</PageWithSidebar>
                      } />
                    ))}

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </NotificationProvider>
          </CreditProvider>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
