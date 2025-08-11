# MADPC Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### Build Status
- [x] **Build successful**: `npm run build` passes without errors
- [x] **TypeScript check**: All type errors resolved
- [x] **Firebase integration**: Complete migration from Supabase
- [x] **SMS functionality**: Twilio integration ready
- [x] **Email notifications**: Resend integration working

## 🚀 Vercel Deployment Steps

### 1. Environment Variables Setup

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

#### **Firebase Configuration (Required)**
```
NEXT_PUBLIC_USE_FIRESTORE=true
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### **App Configuration**
```
NEXT_PUBLIC_APP_NAME=Manso Adubia District Police Command
NEXT_PUBLIC_APP_VERSION=1.0.0
AUTH_SECRET=your_long_random_secret_for_production
```

#### **Email Notifications (Resend)**
```
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=MADPC <no-reply@your-domain.com>
```

#### **SMS Notifications (Twilio)**
```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 2. Firebase Setup Requirements

#### **Firestore Database**
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Set location (recommend: us-central1 or europe-west1)

#### **Authentication**
1. Enable Email/Password authentication
2. Create admin user: `admin@madpc.gov.gh`

#### **Storage**
1. Enable Firebase Storage
2. Set up storage rules for file uploads

### 3. Vercel Deployment

1. **Connect Repository**: Import your GitHub repo to Vercel
2. **Framework**: Next.js (auto-detected)
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `.next` (auto-detected)
5. **Add Environment Variables**: Copy all variables above
6. **Deploy**: Click Deploy

## 🔧 Post-Deployment Tasks

### 1. Initial Data Setup
1. Create admin user in Firebase Auth
2. Add initial personnel records
3. Test email and SMS functionality
4. Verify file upload works

### 2. Security Checklist
- [ ] Firebase Security Rules deployed
- [ ] Strong AUTH_SECRET set
- [ ] Email domain verified in Resend
- [ ] Twilio phone number verified
- [ ] HTTPS enforced (automatic with Vercel)

### 3. Testing Checklist
- [ ] Login/logout works
- [ ] Personnel CRUD operations
- [ ] Case management
- [ ] Duty assignment
- [ ] Email notifications
- [ ] SMS notifications
- [ ] File uploads
- [ ] Reports generation

## 🚨 Important Notes

1. **Environment Variables**: Never commit sensitive keys to git
2. **Firebase Rules**: Deploy security rules before going live
3. **Email Domain**: Verify your domain in Resend for production
4. **Phone Numbers**: Ensure personnel have valid phone numbers for SMS
5. **Backup**: Set up regular Firestore backups

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Check Firebase console for errors
3. Verify all environment variables are set
4. Test API endpoints individually

## 🎯 Success Criteria

Deployment is successful when:
- [ ] App loads without errors
- [ ] Authentication works
- [ ] All CRUD operations function
- [ ] Notifications send successfully
- [ ] File uploads work
- [ ] Reports generate properly
