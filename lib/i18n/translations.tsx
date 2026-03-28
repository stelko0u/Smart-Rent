'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Locale = 'bg' | 'en';

type TranslationPrimitive = string;

export interface TranslationObject {
  [key: string]: TranslationPrimitive | TranslationObject;
}

export type TranslationValue = TranslationPrimitive | TranslationObject;

export const translations = {
  bg: {
    common: {
      appName: 'Smart Rent',
      driveSafe: 'Шофирай безопасно',
      signIn: 'Вход',
      signUp: 'Регистрация',
      signOut: 'Изход',
      save: 'Запази',
      cancel: 'Отказ',
      search: 'Търси',
      clear: 'Изчисти',
      all: 'Всички',
      loading: 'Зареждане...',
      email: 'Имейл',
      phone: 'Телефон',
      password: 'Парола',
      confirmPassword: 'Потвърди паролата',
      firstName: 'Име',
      lastName: 'Фамилия',
      backHome: 'Назад към началото',
    },
    nav: {
      home: 'Начало',
      browseCars: 'Разгледай коли',
      myRentals: 'Моите наеми',
      profile: 'Профил',
      dashboard: 'Табло',
      addCar: 'Добави кола',
      manageCars: 'Управление на коли',
      adminPanel: 'Админ панел',
      manageUsers: 'Управление на потребители',
      reports: 'Справки',
    },
    hero: {
      title: 'Намери перфектната кола за следващото си пътуване',
      subtitle:
        'Достъпни наеми, гъвкави дати и богат избор — от електрически коли до SUV модели.',
      browseCars: 'Разгледай коли',
      howItWorks: 'Как работи',
      searchCars: 'Търси автомобили',
      searchPlaceholder: 'Търси по модел или тип (напр. Tesla, SUV)',
      searchButton: 'Търси',
    },
    searchBar: {
      smartSearch: 'Интелигентно търсене',
      findExactCar: 'Намери точния автомобил',
      carsCount: '{{filtered}} от {{total}} автомобила',
      hideFilters: 'Скрий филтрите',
      moreFilters: 'Още филтри',
      clear: 'Изчисти',
      query: 'Търсене',
      queryPlaceholder: 'Марка, модел, локация...',
      make: 'Марка',
      allMakes: 'Всички марки',
      location: 'Локация',
      allLocations: 'Всички локации',
      bodyType: 'Вид купе',
      startDate: 'Начална дата',
      endDate: 'Крайна дата',
      transmission: 'Трансмисия',
      fuelType: 'Гориво',
      minPrice: 'Мин. цена / ден',
      maxPrice: 'Макс. цена / ден',
      minHorsepower: 'Мин. конски сили',
      maxHorsepower: 'Макс. конски сили',
      yearFrom: 'Година от',
      yearTo: 'Година до',
    },
    language: {
      label: 'Език',
      bg: 'Български',
      en: 'English',
    },
    auth: {
      signInTitle: 'Вход в профила',
      signInSubtitle:
        'Влез, за да управляваш резервации, профил и любими автомобили.',
      signUpTitle: 'Създай акаунт',
      signUpSubtitle:
        'Регистрирай се и започни да наемаш автомобил бързо и лесно.',
      forgotPasswordTitle: 'Забравена парола',
      forgotPasswordSubtitle:
        'Въведи имейла си и ще ти изпратим линк за нова парола.',
      resetPasswordTitle: 'Смяна на парола',
      resetPasswordSubtitle: 'Въведи новата си парола по-долу.',
      noAccount: 'Нямаш акаунт?',
      alreadyHaveAccount: 'Вече имаш акаунт?',
      forgotPassword: 'Забравена парола?',
      rememberPassword: 'Спомни си паролата?',
      createAccount: 'Създай акаунт',
      signInHere: 'Влез оттук',
      requestResetLink: 'Изпрати линк за нова парола',
      resetPasswordButton: 'Смени паролата',
      signingIn: 'Влизане...',
      signingUp: 'Регистрация...',
      sending: 'Изпращане...',
      resetting: 'Смяна...',
      signOutButton: 'Изход от профила',
    },
    validation: {
      requiredEmail: 'Имейлът е задължителен.',
      requiredPassword: 'Паролата е задължителна.',
      requiredFirstName: 'Името е задължително.',
      requiredLastName: 'Фамилията е задължителна.',
      invalidEmail: 'Моля, въведи валиден имейл.',
      passwordMin: 'Паролата трябва да е поне 6 символа.',
      passwordsMismatch: 'Паролите не съвпадат.',
    },
    messages: {
      signInSuccess: 'Успешен вход.',
      signUpSuccess:
        'Регистрацията е успешна. Провери имейла си за потвърждение.',
      resetEmailSent: 'Изпратихме ти имейл с инструкции за смяна на паролата.',
      passwordResetSuccess: 'Паролата беше сменена успешно.',
      unexpectedError: 'Възникна неочаквана грешка.',
      invalidCredentials: 'Невалиден имейл или парола.',
      invalidToken: 'Невалиден или изтекъл токен.',
    },
    vehicle: {
      year: 'Година',
      brand: 'Марка',
      model: 'Модел',
      pricePerDay: 'Цена на ден',
      location: 'Локация',
      bodyType: 'Тип купе',
      transmission: 'Трансмисия',
      fuelType: 'Гориво',
      horsepower: 'Конски сили',
      hp: 'к.с.',
      bodyTypes: {
        sedan: 'Седан',
        hatchback: 'Хечбек',
        suv: 'SUV',
        coupe: 'Купе',
        convertible: 'Кабриолет',
        wagon: 'Комби',
        van: 'Миниван',
        pickup: 'Пикап',
        other: 'Друг',
      },
      transmissions: {
        automatic: 'Автоматична',
        manual: 'Ръчна',
        semiAutomatic: 'Полуавтоматична',
        cvt: 'CVT',
        other: 'Друг',
      },
      fuelTypes: {
        petrol: 'Бензин',
        diesel: 'Дизел',
        electric: 'Електричество',
        hybrid: 'Хибрид',
        other: 'Друг',
      },
    },
  },
  en: {
    common: {
      appName: 'Smart Rent',
      driveSafe: 'Drive Safe',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      clear: 'Clear',
      all: 'All',
      loading: 'Loading...',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      confirmPassword: 'Confirm password',
      firstName: 'First name',
      lastName: 'Last name',
      backHome: 'Back to home',
    },
    nav: {
      home: 'Home',
      browseCars: 'Browse Cars',
      myRentals: 'My Rentals',
      profile: 'Profile',
      dashboard: 'Dashboard',
      addCar: 'Add Car',
      manageCars: 'Manage Cars',
      adminPanel: 'Admin Panel',
      manageUsers: 'Manage Users',
      reports: 'Reports',
    },
    hero: {
      title: 'Find the perfect car for your next trip',
      subtitle:
        'Affordable rentals, flexible dates, and a wide selection — from electric cars to rugged SUVs.',
      browseCars: 'Browse Cars',
      howItWorks: 'How it Works',
      searchCars: 'Search cars',
      searchPlaceholder: 'Search by model or type (e.g., Tesla, SUV)',
      searchButton: 'Search',
    },
    searchBar: {
      smartSearch: 'Smart search',
      findExactCar: 'Find the exact car',
      carsCount: '{{filtered}} of {{total}} cars',
      hideFilters: 'Hide filters',
      moreFilters: 'More filters',
      clear: 'Clear',
      query: 'Search',
      queryPlaceholder: 'Make, model, location...',
      make: 'Make',
      allMakes: 'All makes',
      location: 'Location',
      allLocations: 'All locations',
      bodyType: 'Body type',
      startDate: 'Start date',
      endDate: 'End date',
      transmission: 'Transmission',
      fuelType: 'Fuel type',
      minPrice: 'Min. price / day',
      maxPrice: 'Max. price / day',
      minHorsepower: 'Min. horsepower',
      maxHorsepower: 'Max. horsepower',
      yearFrom: 'Year from',
      yearTo: 'Year to',
    },
    language: {
      label: 'Language',
      bg: 'Български',
      en: 'English',
    },
    auth: {
      signInTitle: 'Sign in to your account',
      signInSubtitle:
        'Sign in to manage reservations, profile, and favorite cars.',
      signUpTitle: 'Create an account',
      signUpSubtitle: 'Register and start renting a car quickly and easily.',
      forgotPasswordTitle: 'Forgot password',
      forgotPasswordSubtitle:
        'Enter your email and we will send you a reset link.',
      resetPasswordTitle: 'Reset password',
      resetPasswordSubtitle: 'Enter your new password below.',
      noAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      forgotPassword: 'Forgot password?',
      rememberPassword: 'Remember your password?',
      createAccount: 'Create account',
      signInHere: 'Sign in here',
      requestResetLink: 'Send reset link',
      resetPasswordButton: 'Reset password',
      signingIn: 'Signing in...',
      signingUp: 'Signing up...',
      sending: 'Sending...',
      resetting: 'Resetting...',
      signOutButton: 'Sign out',
    },
    validation: {
      requiredEmail: 'Email is required.',
      requiredPassword: 'Password is required.',
      requiredFirstName: 'First name is required.',
      requiredLastName: 'Last name is required.',
      invalidEmail: 'Please enter a valid email.',
      passwordMin: 'Password must be at least 6 characters.',
      passwordsMismatch: 'Passwords do not match.',
    },
    messages: {
      signInSuccess: 'Signed in successfully.',
      signUpSuccess:
        'Registration completed successfully. Check your email to confirm your account.',
      resetEmailSent: 'We sent you an email with password reset instructions.',
      passwordResetSuccess: 'Password was reset successfully.',
      unexpectedError: 'An unexpected error occurred.',
      invalidCredentials: 'Invalid email or password.',
      invalidToken: 'Invalid or expired token.',
    },
    vehicle: {
      year: 'Year',
      brand: 'Brand',
      model: 'Model',
      pricePerDay: 'Price per day',
      location: 'Location',
      bodyType: 'Body type',
      transmission: 'Transmission',
      fuelType: 'Fuel type',
      horsepower: 'Horsepower',
      hp: 'HP',
      bodyTypes: {
        sedan: 'Sedan',
        hatchback: 'Hatchback',
        suv: 'SUV',
        coupe: 'Coupe',
        convertible: 'Convertible',
        wagon: 'Wagon',
        van: 'Van',
        pickup: 'Pickup',
        other: 'Other',
      },
      transmissions: {
        automatic: 'Automatic',
        manual: 'Manual',
        semiAutomatic: 'Semi-Automatic',
        cvt: 'CVT',
        other: 'Other',
      },
      fuelTypes: {
        petrol: 'Petrol',
        diesel: 'Diesel',
        electric: 'Electric',
        hybrid: 'Hybrid',
        other: 'Other',
      },
    },
  },
} as const;

export function getNestedValue(
  obj: Record<string, TranslationValue>,
  path: string,
): string | undefined {
  const result = path.split('.').reduce<TranslationValue | undefined>(
    (acc, part) => {
      if (!acc || typeof acc === 'string') return undefined;
      return acc[part];
    },
    obj,
  );

  return typeof result === 'string' ? result : undefined;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
) {
  if (!params) return template;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, String(value));
  }, template);
}

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

type LanguageProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function LanguageProvider({
  children,
  initialLocale = 'bg',
}: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem('locale');

    if (savedLocale === 'bg' || savedLocale === 'en') {
      setLocaleState(savedLocale);
    }

    setMounted(true);
  }, []);

  const setLocale = (nextLocale: Locale) => {
    window.localStorage.setItem('locale', nextLocale);
    setLocaleState(nextLocale);
  };

  const value = useMemo<LanguageContextType>(() => {
    return {
      locale,
      setLocale,
      mounted,
      t: (key: string, params?: Record<string, string | number>) => {
        const template = getNestedValue(
          translations[locale] as Record<string, TranslationValue>,
          key,
        );

        if (!template) return key;

        return interpolate(template, params);
      },
    };
  }, [locale, mounted]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used inside LanguageProvider');
  }

  return context;
}