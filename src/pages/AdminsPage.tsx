/**
 * AdminsPage — samlingssida för adminverktygen.
 *
 * Verktygen låg utspridda: supporten på egen route, "Testa som ny användare"
 * och premiumtilldelningen nere bland kontoinställningarna. Den som blivit
 * admin hade ingen plats som berättade vad rollen faktiskt ger.
 *
 * Supporten länkas i stället för att bäddas in — den är en tvåpanelsinkorg
 * som behöver hela skärmhöjden och fungerar inte som kort.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheck,
  Crown,
  MessageCircle,
  ArrowRight,
  Loader2,
  Check,
  ChefHat,
  Megaphone,
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumAdminPanel from '@/components/admin/PremiumAdminPanel'
import RecipeDriftPanel from '@/components/admin/RecipeDriftPanel'
import AdminManagementPanel from '@/components/admin/AdminManagementPanel'
import AdminMessagePanel from '@/components/admin/AdminMessagePanel'
import { useIsAdmin, useIsSuperAdmin } from '@/hooks/useAdminManagement'
import { usePreviewMode } from '@/hooks/usePreviewMode'
import { useFreeViewMode } from '@/hooks/useFreeViewMode'
import { useSupportAdminUnreadCount } from '@/hooks/useSupportChat'

function CapabilityItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary-600 dark:text-primary-400" />
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{children}</span>
    </li>
  )
}

export default function AdminsPage() {
  const { t } = useTranslation('admin')
  const { t: tSettings } = useTranslation('settings')
  const { data: isAdmin = false, isLoading: adminLoading } = useIsAdmin()
  const { data: isSuperAdmin = false } = useIsSuperAdmin()
  const { isPreviewActive, enterPreview, exitPreview } = usePreviewMode()
  const { isFreeViewActive } = useFreeViewMode()
  const unreadCount = useSupportAdminUnreadCount()

  if (adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-500" />
        </div>
      </DashboardLayout>
    )
  }

  // Sidan gömms i menyn för icke-admins, men vem som helst kan skriva in
  // adressen — spärren måste finnas här också.
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-neutral-500 dark:text-neutral-400">{t('noAccess')}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t('pageTitle')}
            </h1>
            <span
              className={
                isSuperAdmin
                  ? 'text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300'
              }
            >
              {isSuperAdmin ? t('roleSuperAdmin') : t('roleAdmin')}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {t('pageDescription')}
          </p>
        </div>

        {/* Vad rollen ger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('capabilities.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              <CapabilityItem>{t('capabilities.supportInbox')}</CapabilityItem>
              <CapabilityItem>{t('capabilities.directMessage')}</CapabilityItem>
              <CapabilityItem>{t('capabilities.manageFood')}</CapabilityItem>
              <CapabilityItem>{t('capabilities.recipeRequests')}</CapabilityItem>
              <CapabilityItem>{t('capabilities.publishRecipes')}</CapabilityItem>
              <CapabilityItem>{t('capabilities.driftCheck')}</CapabilityItem>
              <CapabilityItem>{t('capabilities.preview')}</CapabilityItem>
              <CapabilityItem>{t('capabilities.freeView')}</CapabilityItem>
            </ul>

            {isSuperAdmin && (
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <p className="mb-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('capabilities.superAdminNote')}
                </p>
                <ul className="space-y-2.5">
                  <CapabilityItem>{t('capabilities.manageAdmins')}</CapabilityItem>
                  <CapabilityItem>{t('capabilities.grantPremium')}</CapabilityItem>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              {t('support.title')}
              {unreadCount > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('support.description')}
            </p>
            {unreadCount > 0 && (
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t(unreadCount === 1 ? 'support.unreadOne' : 'support.unreadOther', {
                  count: unreadCount,
                })}
              </p>
            )}
            <Button asChild variant="outline" className="self-start">
              <Link to="/app/admin/support">
                {t('support.open')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Receptbankens näringsvärden — alla admins, eftersom alla nu kan
            både publicera recept och redigera globala livsmedel. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              {t('drift.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('drift.description')}
            </p>
            <RecipeDriftPanel enabled={isAdmin} />
          </CardContent>
        </Card>

        {/* Testa som ny användare — alla admins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              {tSettings('preview.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {tSettings('preview.description')}
            </p>
            {!isPreviewActive ? (
              <>
                {/*
                  Lägena går att kombinera — och kombinationen är den mest
                  realistiska: en ny användare har nästan alltid gratisnivån.
                  De överlappar inte heller tekniskt: preview byter PROFIL
                  (tom sandlådedata), gratis-vyn byter ENTITLEMENTS
                  (klientspegel i useEntitlements).
                */}
                {isFreeViewActive && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {tSettings('preview.withFreeView')}
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={() => enterPreview.mutate()}
                  disabled={enterPreview.isPending}
                  className="self-start"
                >
                  {enterPreview.isPending
                    ? tSettings('preview.activating')
                    : tSettings('preview.activate')}
                </Button>
              </>
            ) : (
              <>
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800">
                  {tSettings('preview.activeInfo')}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => exitPreview.mutate()}
                  disabled={exitPreview.isPending}
                  className="self-start"
                >
                  {exitPreview.isPending ? tSettings('preview.exiting') : tSettings('preview.exit')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Skicka meddelande till en användare — alla admins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              {t('message.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminMessagePanel />
          </CardContent>
        </Card>

        {/* Adminhantering — endast superadmin */}
        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                {t('management.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminManagementPanel />
            </CardContent>
          </Card>
        )}

        {/* Premium — endast superadmin */}
        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                {t('premium.title')}
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {t('premium.superAdminOnly')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                {t('premium.description')}
              </p>
              <PremiumAdminPanel />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
