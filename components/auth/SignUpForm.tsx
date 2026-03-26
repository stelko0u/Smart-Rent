'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { signUpUser } from '@/lib/api/userApi';

type MessageType = 'success' | 'error' | null;

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
};

type TouchedFields = Record<keyof FormValues, boolean>;

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,}$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{10,}$/;
const POSTAL_CODE_REGEX = /^[A-Za-z0-9\s\-]{3,10}$/;

const INITIAL_VALUES: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  dateOfBirth: '',
};

const INITIAL_TOUCHED: TouchedFields = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  phone: false,
  address: false,
  city: false,
  country: false,
  postalCode: false,
  dateOfBirth: false,
};

function calculateAge(dob: string): number {
  if (!dob) return 0;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function borderClass(value: string, touched: boolean, valid: boolean): string {
  if (!value && !touched) return 'border-black dark:border-black';
  if (!touched) return 'border-black dark:border-black';
  return valid ? 'border-green-500' : 'border-red-500';
}

function focusRingClass(touched: boolean, valid: boolean): string {
  if (!touched) {
    return 'focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700';
  }

  return valid
    ? 'focus:ring-2 focus:ring-green-300 dark:focus:ring-green-700'
    : 'focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700';
}

export default function SignUpForm() {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<TouchedFields>(INITIAL_TOUCHED);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>(null);

  const validation = useMemo(() => {
    const firstNameValid = values.firstName.trim().length >= 2;
    const lastNameValid = values.lastName.trim().length >= 2;
    const emailValid = EMAIL_REGEX.test(values.email.trim());
    const passwordValid = PASSWORD_REGEX.test(values.password);
    const phoneValid = PHONE_REGEX.test(values.phone.trim());
    const addressValid = values.address.trim().length >= 5;
    const cityValid = values.city.trim().length >= 2;
    const countryValid = values.country.trim().length >= 2;
    const postalCodeValid = POSTAL_CODE_REGEX.test(values.postalCode.trim());

    const dateOfBirthValid =
      values.dateOfBirth.length > 0 &&
      !Number.isNaN(new Date(values.dateOfBirth).getTime()) &&
      new Date(values.dateOfBirth) < new Date() &&
      calculateAge(values.dateOfBirth) >= 18;

    return {
      firstName: firstNameValid,
      lastName: lastNameValid,
      email: emailValid,
      password: passwordValid,
      phone: phoneValid,
      address: addressValid,
      city: cityValid,
      country: countryValid,
      postalCode: postalCodeValid,
      dateOfBirth: dateOfBirthValid,
    };
  }, [values]);

  const formInvalid = Object.values(validation).some((isValid) => !isValid);

  const maxBirthDate = new Date().toISOString().split('T')[0];

  const passwordChecks = {
    minLength: values.password.length >= 10,
    lowercase: /[a-z]/.test(values.password),
    uppercase: /[A-Z]/.test(values.password),
    number: /\d/.test(values.password),
    special: /[^\w\s]/.test(values.password),
  };

  const markTouched = (field: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const setAllTouched = () => {
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      postalCode: true,
      dateOfBirth: true,
    });
  };

  const handleChange =
    (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (message) {
        setMessage(null);
        setMessageType(null);
      }
    };

  const resetForm = () => {
    setValues(INITIAL_VALUES);
    setTouched(INITIAL_TOUCHED);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage(null);
    setMessageType(null);
    setAllTouched();

    if (formInvalid) {
      setMessage('Please fix the highlighted fields.');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);

      await signUpUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        country: values.country.trim(),
        postalCode: values.postalCode.trim(),
        dateOfBirth: values.dateOfBirth,
      });

      setMessage('Registration successful!');
      setMessageType('success');
      resetForm();

      router.push('/signin?verify=1');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration error.';

      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900/80"
      aria-label="Sign up form"
      noValidate
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Create an account
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Secure & free
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            First Name
          </label>
          <input
            value={values.firstName}
            onChange={handleChange('firstName')}
            onBlur={() => markTouched('firstName')}
            type="text"
            required
            autoComplete="given-name"
            aria-invalid={touched.firstName && !validation.firstName}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.firstName,
              validation.firstName,
            )} ${borderClass(
              values.firstName,
              touched.firstName,
              validation.firstName,
            )}`}
          />
          {touched.firstName && !validation.firstName && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              First name must be at least 2 characters.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Last Name
          </label>
          <input
            value={values.lastName}
            onChange={handleChange('lastName')}
            onBlur={() => markTouched('lastName')}
            type="text"
            required
            autoComplete="family-name"
            aria-invalid={touched.lastName && !validation.lastName}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.lastName,
              validation.lastName,
            )} ${borderClass(
              values.lastName,
              touched.lastName,
              validation.lastName,
            )}`}
          />
          {touched.lastName && !validation.lastName && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Last name must be at least 2 characters.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
          </label>
          <input
            value={values.email}
            onChange={handleChange('email')}
            onBlur={() => markTouched('email')}
            type="email"
            required
            autoComplete="email"
            aria-invalid={touched.email && !validation.email}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.email,
              validation.email,
            )} ${borderClass(values.email, touched.email, validation.email)}`}
          />
          {touched.email && !validation.email && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Enter a valid email address.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Phone Number
          </label>
          <input
            value={values.phone}
            onChange={handleChange('phone')}
            onBlur={() => markTouched('phone')}
            type="tel"
            required
            autoComplete="tel"
            aria-invalid={touched.phone && !validation.phone}
            placeholder="+1234567890"
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.phone,
              validation.phone,
            )} ${borderClass(values.phone, touched.phone, validation.phone)}`}
          />
          {touched.phone && !validation.phone && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Enter a valid phone number (min 10 digits).
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Address
          </label>
          <input
            value={values.address}
            onChange={handleChange('address')}
            onBlur={() => markTouched('address')}
            type="text"
            required
            autoComplete="street-address"
            aria-invalid={touched.address && !validation.address}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.address,
              validation.address,
            )} ${borderClass(
              values.address,
              touched.address,
              validation.address,
            )}`}
          />
          {touched.address && !validation.address && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Address must be at least 5 characters.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            City
          </label>
          <input
            value={values.city}
            onChange={handleChange('city')}
            onBlur={() => markTouched('city')}
            type="text"
            required
            autoComplete="address-level2"
            aria-invalid={touched.city && !validation.city}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.city,
              validation.city,
            )} ${borderClass(values.city, touched.city, validation.city)}`}
          />
          {touched.city && !validation.city && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              City must be at least 2 characters.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Country
          </label>
          <input
            value={values.country}
            onChange={handleChange('country')}
            onBlur={() => markTouched('country')}
            type="text"
            required
            autoComplete="country-name"
            aria-invalid={touched.country && !validation.country}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.country,
              validation.country,
            )} ${borderClass(
              values.country,
              touched.country,
              validation.country,
            )}`}
          />
          {touched.country && !validation.country && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Country must be at least 2 characters.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Postal Code
          </label>
          <input
            value={values.postalCode}
            onChange={handleChange('postalCode')}
            onBlur={() => markTouched('postalCode')}
            type="text"
            required
            autoComplete="postal-code"
            aria-invalid={touched.postalCode && !validation.postalCode}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              touched.postalCode,
              validation.postalCode,
            )} ${borderClass(
              values.postalCode,
              touched.postalCode,
              validation.postalCode,
            )}`}
          />
          {touched.postalCode && !validation.postalCode && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Enter a valid postal code (3-10 characters).
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 w-full">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Date of Birth
        </label>
        <input
          value={values.dateOfBirth}
          onChange={handleChange('dateOfBirth')}
          onBlur={() => markTouched('dateOfBirth')}
          type="date"
          required
          max={maxBirthDate}
          autoComplete="bday"
          aria-invalid={touched.dateOfBirth && !validation.dateOfBirth}
          className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
            touched.dateOfBirth,
            validation.dateOfBirth,
          )} ${borderClass(
            values.dateOfBirth,
            touched.dateOfBirth,
            validation.dateOfBirth,
          )}`}
        />
        {touched.dateOfBirth && !validation.dateOfBirth && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            You must be at least 18 years old.
          </p>
        )}
      </div>

      <div className="mt-3 md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Password
        </label>
        <input
          value={values.password}
          onChange={handleChange('password')}
          onBlur={() => markTouched('password')}
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          aria-invalid={touched.password && !validation.password}
          className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
            touched.password,
            validation.password,
          )} ${borderClass(
            values.password,
            touched.password,
            validation.password,
          )}`}
        />

        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
          <CheckItem label="10+ chars" ok={passwordChecks.minLength} />
          <CheckItem label="Lowercase" ok={passwordChecks.lowercase} />
          <CheckItem label="Uppercase" ok={passwordChecks.uppercase} />
          <CheckItem label="Number" ok={passwordChecks.number} />
          <CheckItem label="Special" ok={passwordChecks.special} />
        </div>

        {touched.password && !validation.password && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Password does not meet the required complexity.
          </p>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/signin"
          className="font-semibold text-indigo-600 hover:underline"
        >
          Sign In
        </Link>
      </div>

      <button
        type="submit"
        disabled={formInvalid || loading}
        className={`mt-4 inline-flex w-full items-center justify-center gap-3 rounded-lg py-2.5 font-semibold text-white transition ${
          formInvalid || loading
            ? 'cursor-not-allowed bg-indigo-400'
            : 'bg-indigo-600 hover:bg-indigo-700'
        } disabled:opacity-60`}
        aria-disabled={formInvalid || loading}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              opacity="0.25"
            />
            <path
              d="M4 12a8 8 0 0 1 8-8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}
        {loading ? 'Signing up...' : 'Sign up'}
      </button>

      {message && (
        <div
          role={messageType === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mt-4 rounded-md px-4 py-2 text-sm ${
            messageType === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30'
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {ok ? (
        <svg
          className="h-3 w-3 shrink-0 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          className="h-3 w-3 flex-shrink-0 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}

      <span
        className={
          ok
            ? 'text-slate-700 dark:text-slate-200'
            : 'text-slate-500 dark:text-slate-400'
        }
      >
        {label}
      </span>
    </div>
  );
}
