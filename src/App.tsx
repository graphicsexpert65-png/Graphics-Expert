/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DemoSwitcherBar } from './components/DemoSwitcherBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/AuthModal';

import { HomeView } from './views/HomeView';
import { MarketplaceView } from './views/MarketplaceView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { CheckoutView } from './views/CheckoutView';
import { CustomerDashboardView } from './views/CustomerDashboardView';
import { FreeToolsView } from './views/FreeToolsView';
import { CustomDesignView } from './views/CustomDesignView';
import { PricingView } from './views/PricingView';
import { DesignerPortalView } from './views/DesignerPortalView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { FaqView } from './views/FaqView';
import { LicenseView } from './views/LicenseView';

const MainContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <main className="flex-1">
      {currentView === 'home' && <HomeView />}
      {currentView === 'marketplace' && <MarketplaceView />}
      {currentView === 'product-detail' && <ProductDetailView />}
      {currentView === 'cart' && <CartView />}
      {currentView === 'checkout' && <CheckoutView />}
      {currentView === 'dashboard' && <CustomerDashboardView />}
      {currentView === 'tools' && <FreeToolsView />}
      {currentView === 'custom-design' && <CustomDesignView />}
      {currentView === 'pricing' && <PricingView />}
      {(currentView === 'become-designer' || currentView === 'designer-dashboard') && (
        <DesignerPortalView />
      )}
      {currentView === 'admin-dashboard' && <AdminDashboardView />}
      {currentView === 'about' && <AboutView />}
      {currentView === 'contact' && <ContactView />}
      {currentView === 'faq' && <FaqView />}
      {currentView === 'licenses' && <LicenseView />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <DemoSwitcherBar />
        <Header />
        <MainContent />
        <Footer />
        <AuthModal />
        <ToastContainer />
      </div>
    </AppProvider>
  );
}
