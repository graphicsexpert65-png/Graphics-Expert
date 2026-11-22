import React from 'react';
import { buildPath, useApp } from '../context/AppContext';
import { ViewState } from '../types';

interface AppLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  view: ViewState;
  productId?: string;
  categoryId?: string;
  toolId?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}

/**
 * A real <a href> so every page is crawlable and can be opened in a new tab,
 * while normal clicks navigate inside the app without a page reload.
 */
export const AppLink: React.FC<AppLinkProps> = ({
  view,
  productId,
  categoryId,
  toolId,
  onNavigate,
  children,
  ...rest
}) => {
  const { setCurrentView, products } = useApp();
  const product = productId ? products.find((p) => p.id === productId || p.slug === productId) : undefined;
  const href = buildPath(view, product ? product.slug : productId ?? null, categoryId ?? null);

  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        setCurrentView(view, { productId, categoryId, toolId });
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
};
