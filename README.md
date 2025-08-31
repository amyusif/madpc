# MADPC - Manso Adubia District Police Command System

A modern police command and control system built with Next.js 15, Firebase Firestore, and TypeScript.

## Features

- 🔐 **Secure Authentication** - Firebase Auth integration
- 👮 **Personnel Management** - Track officers and staff
- 📋 **Case Management** - Handle investigations and incidents
- 📅 **Duty Scheduling** - Assign and track duties
- 📊 **Reports & Analytics** - Generate insights and reports
- 💬 **Communication** - Internal messaging system
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI
- 🗄️ **Firebase Database** - Scalable NoSQL database with real-time updates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **TypeScript**: Full type safety

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd madpcs
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env.local
```

4. **Configure Firebase** credentials in `.env.local`:
   - Set up Firebase project and Firestore database
   - Add your Firebase configuration variables

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup

This system uses Firebase Firestore for all data operations. You'll need to:

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Firestore Database** in your project
3. **Set up Authentication** (Email/Password)
4. **Configure environment variables** with your Firebase project details

### Required Firebase Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

## Deployment

### Deploy to Vercel

The easiest way to deploy this application is using Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Environment Variables

Required environment variables for deployment:

```bash
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# App Configuration
NEXT_PUBLIC_APP_NAME="Manso Adubia District Police Command"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── views/              # Page components
├── hooks/              # Custom React hooks
├── integrations/       # Firebase integrations
├── contexts/           # React contexts
└── lib/                # Utility functions
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- **Firebase Setup**: Check Firebase Console and documentation
- **General Issues**: Contact the MADPC Development Team
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
