# Athena — Smart Study Management

Athena is a premium study management dashboard designed for students and self-learners to track subjects, revisions, daily planning, and analytics. Built with modern web technologies, it offers a beautiful, responsive, and intuitive interface to help you achieve your learning goals.

## Features

- **Dashboard**: Get a bird's-eye view of your progress, upcoming tasks, daily streak, and recent activities.
- **Subject Tracking**: Organize your studies by subjects, chapters, and topics. Track completion and revision status for each topic.
- **Task Planner**: Manage your study sessions, assignments, and exams. Set priorities and due dates.
- **Revision Tracker**: Ensure long-term retention by tracking which topics need to be revised.
- **Analytics**: Visualize your productivity with beautiful charts showing study minutes over time.
- **Gamification**: Maintain your daily streak and get motivational quotes to keep you going.
- **First-Time Tutorial**: An automated, auto-navigating tutorial that introduces you to every feature on your first visit.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app`: Contains all the Next.js pages and routes (dashboard, analytics, planner, revisions, settings, subjects, tasks).
- `/src/components`: Reusable UI components, layout elements, and the interactive tutorial overlay.
- `/src/store`: Zustand stores for managing global state (subjects, tasks, activity, planner).
- `/src/lib`: Utility functions and configuration files.

## License

MIT License.
