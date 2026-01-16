'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';

export default function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(
    null
  );

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const nameTimer = useRef<number | null>(null);
  const emailTimer = useRef<number | null>(null);
  const passwordTimer = useRef<number | null>(null);
  const TYPING_DEBOUNCE_MS = 700;

  const emailRegex = /^\S+@\S+\.\S+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,}$/;

  const nameValid = name.trim().length >= 3;
  const emailValid = emailRegex.test(email);
  const passwordValid = passwordRegex.test(password);

  const router = useRouter();

  function borderClass(value: string, touched: boolean, valid: boolean) {
    if (!value && !touched) return 'border-black dark:border-black';
    if (!touched) return 'border-black dark:border-black';
    return valid ? 'border-green-500' : 'border-red-500';
  }

  function focusRingClass(touched: boolean, valid: boolean) {
    if (!touched)
      return 'focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700';
    return valid
      ? 'focus:ring-2 focus:ring-green-300 dark:focus:ring-green-700'
      : 'focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700';
  }

  useEffect(() => {
    return () => {
      if (nameTimer.current) window.clearTimeout(nameTimer.current);
      if (emailTimer.current) window.clearTimeout(emailTimer.current);
      if (passwordTimer.current) window.clearTimeout(passwordTimer.current);
    };
  }, []);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);

    if (nameTimer.current) window.clearTimeout(nameTimer.current);
    if (!v) {
      setNameTouched(false);
      return;
    }
    nameTimer.current = window.setTimeout(() => {
      setNameTouched(true);
      nameTimer.current = null;
    }, TYPING_DEBOUNCE_MS);
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setEmail(v);

    if (emailTimer.current) window.clearTimeout(emailTimer.current);
    if (!v) {
      setEmailTouched(false);
      return;
    }
    emailTimer.current = window.setTimeout(() => {
      setEmailTouched(true);
      emailTimer.current = null;
    }, TYPING_DEBOUNCE_MS);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPassword(v);

    if (passwordTimer.current) window.clearTimeout(passwordTimer.current);
    if (!v) {
      setPasswordTouched(false);
      return;
    }
    passwordTimer.current = window.setTimeout(() => {
      setPasswordTouched(true);
      passwordTimer.current = null;
    }, TYPING_DEBOUNCE_MS);
  }

  function handleNameBlur() {
    if (nameTimer.current) {
      window.clearTimeout(nameTimer.current);
      nameTimer.current = null;
    }
    setNameTouched(true);
  }

  function handleEmailBlur() {
    if (emailTimer.current) {
      window.clearTimeout(emailTimer.current);
      emailTimer.current = null;
    }
    setEmailTouched(true);
  }

  function handlePasswordBlur() {
    if (passwordTimer.current) {
      window.clearTimeout(passwordTimer.current);
      passwordTimer.current = null;
    }
    setPasswordTouched(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (nameTimer.current) {
      window.clearTimeout(nameTimer.current);
      nameTimer.current = null;
    }
    if (emailTimer.current) {
      window.clearTimeout(emailTimer.current);
      emailTimer.current = null;
    }
    if (passwordTimer.current) {
      window.clearTimeout(passwordTimer.current);
      passwordTimer.current = null;
    }

    if (!nameValid || !emailValid || !passwordValid) {
      setMessage('Please fix the highlighted fields.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      setMessage('Registration successful!');
      setMessageType('success');
      setName('');
      setEmail('');
      setPassword('');
      setNameTouched(false);
      setEmailTouched(false);
      setPasswordTouched(false);
      router.push('/signin?verify=1');
    } catch (err: any) {
      setMessage(err.message || 'Registration error.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  const formInvalid = !nameValid || !emailValid || !passwordValid;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md p-8 bg-white dark:bg-slate-900/80 shadow-xl rounded-xl"
      aria-label="Sign up form"
      noValidate
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Create an account
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Secure & free
        </span>
      </div>

      <div className="mb-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Full name
        </label>
        <input
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          type="text"
          required
          className={`mt-2 w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none ${focusRingClass(
            nameTouched,
            nameValid
          )} ${borderClass(name, nameTouched, nameValid)}`}
          autoComplete="name"
          aria-invalid={nameTouched && !nameValid}
        />
        {nameTouched && !nameValid && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Name must be at least 3 characters.
          </p>
        )}
      </div>

      <div className="mb-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Email
        </label>
        <input
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          type="email"
          required
          className={`mt-2 w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none ${focusRingClass(
            emailTouched,
            emailValid
          )} ${borderClass(email, emailTouched, emailValid)}`}
          autoComplete="email"
          aria-invalid={emailTouched && !emailValid}
        />
        {emailTouched && !emailValid && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Enter a valid email address.
          </p>
        )}
      </div>

      <div className="mb-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Password
        </label>
        <input
          value={password}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
          type="password"
          required
          minLength={10}
          className={`mt-2 w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none ${focusRingClass(
            passwordTouched,
            passwordValid
          )} ${borderClass(password, passwordTouched, passwordValid)}`}
          autoComplete="new-password"
          aria-invalid={passwordTouched && !passwordValid}
        />

        <div className="mt-2 space-y-1">
          {/* live checklist for password */}
          <CheckItem
            label="At least 10 characters"
            ok={password.length >= 10}
          />
          <CheckItem label="Lowercase letter" ok={/[a-z]/.test(password)} />
          <CheckItem label="Uppercase letter" ok={/[A-Z]/.test(password)} />
          <CheckItem label="Number" ok={/\d/.test(password)} />
          <CheckItem label="Special character" ok={/[^\w\s]/.test(password)} />
        </div>

        {passwordTouched && !passwordValid && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Password does not meet the required complexity.
          </p>
        )}
      </div>
      <div className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <a
          href="/signin"
          className="text-indigo-600 font-semibold hover:underline"
        >
          Sign In
        </a>
      </div>
      <button
        type="submit"
        disabled={formInvalid || loading}
        className={`mt-6 w-full inline-flex items-center justify-center gap-3 ${
          formInvalid || loading
            ? 'bg-indigo-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        } disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition`}
        aria-disabled={formInvalid || loading}
      >
        {loading && (
          <svg
            className="w-4 h-4 animate-spin"
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
              d="M4 12a8 8 0 018-8"
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
          className={`mt-4 px-4 py-2 rounded-md text-sm ${
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

/* small helper component: check item with icon */
function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <svg
          className="w-4 h-4 text-green-500"
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
          className="w-4 h-4 text-slate-400"
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
