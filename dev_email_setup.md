# 📧 Development Email Setup (Nodemailer + Gmail OAuth)

This document explains how to configure **development-only email sending** using **Gmail OAuth2 + Nodemailer**.

⚠️ **Important**

- This setup is **ONLY for development**
- Production uses **Resend** (no Gmail, no Nodemailer)
- Each developer must use **their own Gmail account**

---

## 🧠 Why this setup exists

- Prevents sharing email passwords
- Avoids accidental production emails
- Matches real OTP / onboarding flows during development
- Easy to revoke access per developer

---

## ✅ Prerequisites

Before starting, make sure you have:

- A Google (Gmail) account
- Access to Google Cloud Console
- Project cloned locally
- Node.js installed

---

## 1️⃣ Create a Google Cloud Project

1. Go to **Google Cloud Console**
2. Click **Select Project → New Project**
3. Project name:

   ```
   fugal-labs-dev-email
   ```

4. Click **Create**

> Each developer can create their own project.

---

## 2️⃣ Enable Gmail API

1. Inside the project, go to **APIs & Services → Library**
2. Search for **Gmail API**
3. Click **Enable**

⚠️ Skipping this step will break OAuth.

---

## 3️⃣ Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → Create
3. Fill minimum details:
   - App name: `Fugal Labs Dev Mailer`
   - User support email: your Gmail
   - Developer contact email: your Gmail

4. Click **Save & Continue** until finished

> No verification is required (dev-only usage).

---

## 4️⃣ Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth Client ID**
3. Application type: **Web Application**
4. Name:

   ```
   Nodemailer Dev Client
   ```

5. Add this **Authorized Redirect URI**:

   ```
   https://developers.google.com/oauthplayground
   ```

6. Click **Create**

📌 Save these values:

- Client ID
- Client Secret

---

## 5️⃣ Generate Gmail Refresh Token

We use **OAuth Playground** to generate a long-lived refresh token.

### Steps:

1. Open OAuth Playground:

   ```
   https://developers.google.com/oauthplayground
   ```

2. Click **⚙️ Settings** (top-right)
3. Enable **Use your own OAuth credentials**
4. Paste:
   - Client ID
   - Client Secret

5. Close settings

---

### Select Gmail Scope

In **Step 1**, paste:

```
https://mail.google.com/
```

Click **Authorize APIs** and login with the **same Gmail account** you want to send emails from.

---

### Exchange Token

1. Click **Exchange authorization code for tokens**
2. Copy the **Refresh Token**

This token does **not expire** unless manually revoked.

---

## 6️⃣ Environment Variables (.env)

Create or update your `.env` file:

```env
NODE_ENV=development

EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com

EMAIL_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
EMAIL_CLIENT_SECRET=xxxxxxxx
EMAIL_REFRESH_TOKEN=xxxxxxxx
```

⚠️ Do NOT commit this file.

---

## 7️⃣ How Nodemailer Uses This

The app will automatically use Nodemailer **only in development**.

You do not need to change any OTP or email logic.

---

## 8️⃣ Quick Test (Optional)

Start the backend and trigger any OTP flow.

If you receive an email → setup is correct ✅

---

## 🚫 Common Mistakes

- Using App Passwords instead of OAuth
- Forgetting to enable Gmail API
- Wrong redirect URI
- Different Gmail for OAuth and EMAIL_USER
- Trying to use this setup in production

---

## 🔐 Token Revocation (If Needed)

If a token is compromised:

1. Go to **Google Account → Security**
2. Find **Third-party access**
3. Revoke the OAuth app

---

## ✅ Summary

- Dev → Gmail OAuth + Nodemailer
- Prod → Resend only
- One-time OAuth setup per developer
- Safe, revocable, and scalable

---

If anything breaks, ask the lead developer before changing email config.
