# MADPC - Manso Adubia District Police Command System

A modern police command and control system built with Next.js 15, Supabase, and TypeScript.

## Features

- 🔐 **Secure Authentication** - Supabase Auth integration
- 👮 **Personnel Management** - Track officers and staff
- 📋 **Case Management** - Handle investigations and incidents
- 📅 **Duty Scheduling** - Assign and track duties
- 📊 **Reports & Analytics** - Generate insights and reports
- 💬 **Communication** - Internal messaging system
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

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

4. Configure your Supabase credentials in `.env.local`

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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
├── integrations/       # External service integrations
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

For support and questions, please contact the MADPC Development Team.
