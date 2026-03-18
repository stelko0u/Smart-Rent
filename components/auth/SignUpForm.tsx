'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function SignUpForm() {
  const router = useRouter();

  // Form field states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(
    null,
  );

  // Touched states
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);
  const [postalCodeTouched, setPostalCodeTouched] = useState(false);
  const [dateOfBirthTouched, setDateOfBirthTouched] = useState(false);

  // Validation regexes
  const emailRegex = /^\S+@\S+\.\S+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,}$/;
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;

  const calculateAge = (dob: string): number => {
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
  };

  // Validation booleans
  const firstNameValid = firstName.trim().length >= 2;
  const lastNameValid = lastName.trim().length >= 2;
  const emailValid = emailRegex.test(email.trim());
  const passwordValid = passwordRegex.test(password);
  const phoneValid = phoneRegex.test(phone.trim());
  const addressValid = address.trim().length >= 5;
  const cityValid = city.trim().length >= 2;
  const countryValid = country.trim().length >= 2;
  const postalCodeValid = postalCodeRegex.test(postalCode.trim());
  const dateOfBirthValid: boolean =
    dateOfBirth.length > 0 &&
    !Number.isNaN(new Date(dateOfBirth).getTime()) &&
    new Date(dateOfBirth) < new Date() &&
    calculateAge(dateOfBirth) >= 18;

  function borderClass(value: string, touched: boolean, valid: boolean) {
    if (!value && !touched) return 'border-black dark:border-black';
    if (!touched) return 'border-black dark:border-black';
    return valid ? 'border-green-500' : 'border-red-500';
  }

  function focusRingClass(touched: boolean, valid: boolean) {
    if (!touched) {
      return 'focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700';
    }

    return valid
      ? 'focus:ring-2 focus:ring-green-300 dark:focus:ring-green-700'
      : 'focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700';
  }

  function resetForm() {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAddress('');
    setCity('');
    setCountry('');
    setPostalCode('');
    setDateOfBirth('');

    setFirstNameTouched(false);
    setLastNameTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
    setPhoneTouched(false);
    setAddressTouched(false);
    setCityTouched(false);
    setCountryTouched(false);
    setPostalCodeTouched(false);
    setDateOfBirthTouched(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    // Set all fields as touched
    setFirstNameTouched(true);
    setLastNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setPhoneTouched(true);
    setAddressTouched(true);
    setCityTouched(true);
    setCountryTouched(true);
    setPostalCodeTouched(true);
    setDateOfBirthTouched(true);

    if (
      !firstNameValid ||
      !lastNameValid ||
      !emailValid ||
      !passwordValid ||
      !phoneValid ||
      !addressValid ||
      !cityValid ||
      !countryValid ||
      !postalCodeValid ||
      !dateOfBirthValid
    ) {
      setMessage('Please fix the highlighted fields.');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
          postalCode: postalCode.trim(),
          dateOfBirth,
        }),
      });

      const data: { message?: string; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

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
  }

  const formInvalid =
    !firstNameValid ||
    !lastNameValid ||
    !emailValid ||
    !passwordValid ||
    !phoneValid ||
    !addressValid ||
    !cityValid ||
    !countryValid ||
    !postalCodeValid ||
    !dateOfBirthValid;

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
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => setFirstNameTouched(true)}
            type="text"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              firstNameTouched,
              firstNameValid,
            )} ${borderClass(firstName, firstNameTouched, firstNameValid)}`}
            autoComplete="given-name"
            aria-invalid={firstNameTouched && !firstNameValid}
          />
          {firstNameTouched && !firstNameValid && (
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
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => setLastNameTouched(true)}
            type="text"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              lastNameTouched,
              lastNameValid,
            )} ${borderClass(lastName, lastNameTouched, lastNameValid)}`}
            autoComplete="family-name"
            aria-invalid={lastNameTouched && !lastNameValid}
          />
          {lastNameTouched && !lastNameValid && (
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            type="email"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              emailTouched,
              emailValid,
            )} ${borderClass(email, emailTouched, emailValid)}`}
            autoComplete="email"
            aria-invalid={emailTouched && !emailValid}
          />
          {emailTouched && !emailValid && (
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            type="tel"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              phoneTouched,
              phoneValid,
            )} ${borderClass(phone, phoneTouched, phoneValid)}`}
            autoComplete="tel"
            aria-invalid={phoneTouched && !phoneValid}
            placeholder="+1234567890"
          />
          {phoneTouched && !phoneValid && (
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
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => setAddressTouched(true)}
            type="text"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              addressTouched,
              addressValid,
            )} ${borderClass(address, addressTouched, addressValid)}`}
            autoComplete="street-address"
            aria-invalid={addressTouched && !addressValid}
          />
          {addressTouched && !addressValid && (
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
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onBlur={() => setCityTouched(true)}
            type="text"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              cityTouched,
              cityValid,
            )} ${borderClass(city, cityTouched, cityValid)}`}
            autoComplete="address-level2"
            aria-invalid={cityTouched && !cityValid}
          />
          {cityTouched && !cityValid && (
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
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onBlur={() => setCountryTouched(true)}
            type="text"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              countryTouched,
              countryValid,
            )} ${borderClass(country, countryTouched, countryValid)}`}
            autoComplete="country-name"
            aria-invalid={countryTouched && !countryValid}
          />
          {countryTouched && !countryValid && (
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
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            onBlur={() => setPostalCodeTouched(true)}
            type="text"
            required
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
              postalCodeTouched,
              postalCodeValid,
            )} ${borderClass(postalCode, postalCodeTouched, postalCodeValid)}`}
            autoComplete="postal-code"
            aria-invalid={postalCodeTouched && !postalCodeValid}
          />
          {postalCodeTouched && !postalCodeValid && (
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
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          onBlur={() => setDateOfBirthTouched(true)}
          type="date"
          required
          max={new Date().toISOString().split('T')[0]}
          className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
            dateOfBirthTouched,
            dateOfBirthValid,
          )} ${borderClass(dateOfBirth, dateOfBirthTouched, dateOfBirthValid)}`}
          autoComplete="bday"
          aria-invalid={dateOfBirthTouched && !dateOfBirthValid}
        />
        {dateOfBirthTouched && !dateOfBirthValid && (
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setPasswordTouched(true)}
          type="password"
          required
          minLength={10}
          className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${focusRingClass(
            passwordTouched,
            passwordValid,
          )} ${borderClass(password, passwordTouched, passwordValid)}`}
          autoComplete="new-password"
          aria-invalid={passwordTouched && !passwordValid}
        />

        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
          <CheckItem label="10+ chars" ok={password.length >= 10} />
          <CheckItem label="Lowercase" ok={/[a-z]/.test(password)} />
          <CheckItem label="Uppercase" ok={/[A-Z]/.test(password)} />
          <CheckItem label="Number" ok={/\d/.test(password)} />
          <CheckItem label="Special" ok={/[^\w\s]/.test(password)} />
        </div>

        {passwordTouched && !passwordValid && (
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
