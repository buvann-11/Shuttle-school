import type { RouteObject } from 'react-router';
import { LessonPage, ResumeRedirect } from '@/features/lessons/LessonPage';
import { AppLayout } from './App';
import { NotFound } from './NotFound';
import { RouteError } from './RouteError';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <ResumeRedirect /> },
      { path: 'lessons/:lessonId', element: <LessonPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
