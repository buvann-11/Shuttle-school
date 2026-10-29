import type { Pose, Vec2 } from '@/engine/pose';

export type LessonLevel = 'Foundations' | 'Strokes';
export type GripName = 'forehand' | 'backhand';

interface KeyframeBase {
  label: string;
  cue: string;
  duration: number;
}

export interface FigureKeyframe extends KeyframeBase {
  linear: boolean;
  pose: Pose;
}

export interface GripKeyframe extends KeyframeBase {
  grip: GripName;
}

export interface ShuttleFlight {
  contactKey: number;
  from: Vec2;
  arcIn: number;
  inDuration: number;
  to: Vec2;
  arcOut: number;
  outDuration: number;
}

interface LessonBase {
  id: string;
  /** 1-based position in the course. */
  number: number;
  level: LessonLevel;
  title: string;
  summary: string;
  points: readonly string[];
  mistakes: readonly string[];
  drill: string;
}

export interface FigureLesson extends LessonBase {
  kind: 'figure';
  keys: readonly FigureKeyframe[];
  shuttle: ShuttleFlight | null;
  netX: number | null;
}

export interface GripLesson extends LessonBase {
  kind: 'grip';
  keys: readonly GripKeyframe[];
}

export type Lesson = FigureLesson | GripLesson;
