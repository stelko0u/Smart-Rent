'use client';

import React from 'react';
import { AngleLeft, AngleRight, CircleInfo, MagnifyingGlass } from '../icons';

interface CompanyPanelPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  rightSlot?: React.ReactNode;
}

export function CompanyPanelPageHeader({
  eyebrow,
  title,
  description,
  rightSlot,
}: CompanyPanelPageHeaderProps) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
            {eyebrow}
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            {description}
          </p>
        </div>

        {rightSlot ? <div className="xl:min-w-[320px]">{rightSlot}</div> : null}
      </div>
    </section>
  );
}

interface CompanyPanelInfoCardProps {
  label: string;
  value: string;
  description?: string;
  tone?: 'default' | 'success' | 'warning';
}

export function CompanyPanelInfoCard({
  label,
  value,
  description,
  tone = 'default',
}: CompanyPanelInfoCardProps) {
  const toneClassName =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-gray-200 bg-gray-50';

  const labelClassName =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : 'text-gray-500';

  const valueClassName =
    tone === 'success'
      ? 'text-emerald-900'
      : tone === 'warning'
        ? 'text-amber-900'
        : 'text-gray-900';

  const descriptionClassName =
    tone === 'success'
      ? 'text-emerald-700/80'
      : tone === 'warning'
        ? 'text-amber-700/80'
        : 'text-gray-500';

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-[0.14em] ${labelClassName}`}
      >
        {label}
      </p>
      <p className={`mt-2 text-lg font-semibold ${valueClassName}`}>{value}</p>
      {description ? (
        <p className={`mt-1 text-sm ${descriptionClassName}`}>{description}</p>
      ) : null}
    </div>
  );
}

interface CompanyPanelStatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'accent' | 'surface' | 'success';
  badge?: string;
}

export function CompanyPanelStatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'surface',
  badge,
}: CompanyPanelStatCardProps) {
  const wrapperClassName =
    variant === 'accent'
      ? 'border-transparent bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_20px_60px_rgba(99,102,241,0.28)]'
      : variant === 'success'
        ? 'border-transparent bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_20px_60px_rgba(34,197,94,0.22)]'
        : 'border-gray-200 bg-white text-gray-900 shadow-sm';

  const iconClassName =
    variant === 'surface'
      ? 'bg-gray-100 text-gray-500'
      : 'bg-white/15 text-white';

  const mutedClassName =
    variant === 'surface' ? 'text-gray-500' : 'text-white/80';

  return (
    <div className={`rounded-3xl border p-4 sm:p-6 ${wrapperClassName}`}>
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${mutedClassName}`}>{title}</p>
          <p className="mt-2 truncate text-3xl font-bold tracking-tight sm:mt-3 sm:text-4xl">
            {value}
          </p>
        </div>

        <div className={`shrink-0 rounded-2xl p-2.5 sm:p-3 ${iconClassName}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className={`min-w-0 text-sm ${mutedClassName}`}>{subtitle}</p>
        {badge ? (
          <span
            className={
              variant === 'surface'
                ? 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600'
                : 'rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white'
            }
          >
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface CompanyPanelMetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentClassName: string;
}

export function CompanyPanelMetricCard({
  title,
  value,
  icon,
  accentClassName,
}: CompanyPanelMetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:p-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`shrink-0 rounded-2xl p-2.5 sm:p-3 ${accentClassName}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-gray-900 sm:text-2xl">{value}</p>
          <p className="line-clamp-2 text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

interface CompanyPanelCardProps {
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function CompanyPanelCard({
  title,
  description,
  rightSlot,
  children,
}: CompanyPanelCardProps) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>

        {rightSlot ? <div className="w-full sm:w-auto">{rightSlot}</div> : null}
      </div>

      <div>{children}</div>
    </section>
  );
}

interface CompanyPanelEmptyStateProps {
  title: string;
  description: string;
}

export function CompanyPanelEmptyState({
  title,
  description,
}: CompanyPanelEmptyStateProps) {
  return (
    <div className="px-6 py-16 text-center sm:px-8">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <CircleInfo className="h-7 w-7 text-gray-400" />
      </div>
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

interface CompanyPanelToolbarProps {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function CompanyPanelToolbar({
  leftSlot,
  rightSlot,
}: CompanyPanelToolbarProps) {
  return (
    <div className="flex flex-col gap-3 px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">{leftSlot}</div>
      <div className="w-full min-w-0 lg:w-auto">{rightSlot}</div>
    </div>
  );
}

interface CompanyPanelTabsProps<T extends string> {
  value: T;
  options: ReadonlyArray<{
    value: T;
    label: string;
    count?: number;
  }>;
  onChange: (value: T) => void;
}

export function CompanyPanelTabs<T extends string>({
  value,
  options,
  onChange,
}: CompanyPanelTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              isActive
                ? 'rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm'
                : 'rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200'
            }
          >
            <span>{option.label}</span>
            {typeof option.count === 'number' ? (
              <span
                className={
                  isActive
                    ? 'ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs'
                    : 'ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-gray-500'
                }
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

interface CompanyPanelSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function CompanyPanelSearch({
  value,
  onChange,
  placeholder,
}: CompanyPanelSearchProps) {
  return (
    <div className="relative w-full min-w-0 lg:min-w-[260px]">
      <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}

interface CompanyPanelBadgeProps {
  children: React.ReactNode;
  tone?: 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'indigo';
}

export function CompanyPanelBadge({
  children,
  tone = 'gray',
}: CompanyPanelBadgeProps) {
  const className =
    tone === 'blue'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'green'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : tone === 'red'
            ? 'border-red-200 bg-red-50 text-red-700'
            : tone === 'indigo'
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

interface CompanyPanelPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function CompanyPanelPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: CompanyPanelPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const compactPages =
    totalPages <= 7
      ? pages
      : [
          1,
          ...(currentPage > 4 ? [-1] : []),
          ...pages.filter(
            (page) =>
              page !== 1 &&
              page !== totalPages &&
              Math.abs(page - currentPage) <= 1,
          ),
          ...(currentPage < totalPages - 3 ? [-2] : []),
          totalPages,
        ];

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{firstItem}</span>{' '}
        to <span className="font-semibold text-gray-900">{lastItem}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <AngleLeft className="h-4 w-4" />
          Prev
        </button>

        {compactPages.map((page, index) =>
          page < 0 ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-10 items-center px-2 text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={
                page === currentPage
                  ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm'
                  : 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50'
              }
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <AngleRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
