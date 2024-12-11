This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## This Repo is a minimal reproduction of the Clerk Core 2 Satellite Domain Issue

### Background

Our production app running on clerk core v1 works perfectly fine with this
setup. Since we are trying to upgrade to core v2 we are running into errors.

### My Test Setup

- Nextjs 15 App
- Clerk w/ dynamic mode
- deployed via Vercel
- Primary Domain: clerk-core2-satellite.vercel.app
- Satellite Domain: satellite.stbrd.com (configured in vercel and clerk)

The Nextjs App redirects the user to a satellite domain if its configured for
the user (hardcoded in middleware). The login is always on the primary domain.

### Error

> **Important:** this is a production only issue. You need to test it in a
> deployed setup.

Scenario 1: Signin in with a user that has **no satellite** configured. Works
fine.

Scenario 2: Signin in with a user that has satellite configured. Infinite loop.

Error:

```
Clerk: Refreshing the session token resulted in an infinite redirect loop. This usually means that your Clerk instance keys do not match - make sure to copy the correct publishable and secret keys from the Clerk dashboard.
```

## Getting Started

First, copy .env.example

```bash
cp .env.example .env.local
```

Add env vars

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.
