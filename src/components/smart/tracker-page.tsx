"use client";

import { BottomTabBar } from "@/components/shared/bottom-tab-bar";
import { FloatingAddButton } from "@/components/shared/floating-add-button";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AnalyticsSection } from "@/components/smart/sections/analytics-section";
import { HomeSection } from "@/components/smart/sections/home-section";
import { RecurringSection } from "@/components/smart/sections/recurring-section";
import { TransactionsSection } from "@/components/smart/sections/transactions-section";
import { TrackerDialogs } from "@/components/smart/tracker-dialogs";
import { TrackerSkeleton } from "@/components/smart/tracker-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SECTIONS, type Section } from "@/config/sections";
import { useTracker } from "@/context/tracker-context";
import { cn } from "@/lib/utils";

/** The tracker: header, the five sections (top tabs on desktop, a bottom tab bar on phones), overlays, footer. */
export function TrackerPage() {
  const { data, dialogs, section, setSection } = useTracker();
  const showPhoneNav = !data.loading && data.wallets.length > 0;

  // Phones: the floating Add button does what the current section's Add does (none on Analytics).
  const floatingAdd: Partial<Record<Section, { label: string; onClick: () => void }>> = {
    home: { label: "Add", onClick: () => dialogs.openEntry() },
    income: { label: "Add income", onClick: () => dialogs.openEntry("income") },
    expenses: { label: "Add expense", onClick: () => dialogs.openEntry("expense") },
    recurring: { label: "Add recurring", onClick: () => dialogs.openEntry("recurring") },
  };
  const fab = floatingAdd[section];

  return (
    <div className={cn("flex min-h-svh flex-col", showPhoneNav && "max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]")}>
      <SiteHeader />
      <main className="w-full flex-1">
        <div className={cn("mx-auto w-full max-w-3xl px-4 py-6", showPhoneNav && "max-md:pb-24")}>
          {data.loading ? (
            <TrackerSkeleton />
          ) : (
            <Tabs value={section} onValueChange={(value) => setSection(value as Section)}>
              {data.wallets.length > 0 && (
                <TabsList className="mt-2 max-md:hidden">
                  {SECTIONS.map((item) => (
                    <TabsTrigger key={item.value} value={item.value}>
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
              <TabsContent value="home">
                <HomeSection />
              </TabsContent>
              <TabsContent value="income">
                <TransactionsSection type="income" />
              </TabsContent>
              <TabsContent value="expenses">
                <TransactionsSection type="expense" />
              </TabsContent>
              <TabsContent value="recurring">
                <RecurringSection />
              </TabsContent>
              <TabsContent value="analytics">
                <AnalyticsSection />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <TrackerDialogs />

      {showPhoneNav && (
        <>
          <BottomTabBar tabs={SECTIONS} value={section} onChange={setSection} />
          {fab && <FloatingAddButton label={fab.label} onClick={fab.onClick} />}
        </>
      )}

      <SiteFooter />
    </div>
  );
}
