import { z } from 'zod';
import { POSE_KEYS, type PoseKey } from '@/engine/pose';

const nonEmpty = z.string().trim().min(1);
const vec2 = z.tuple([z.number(), z.number()]);

const poseOverrides = z
  .object(
    Object.fromEntries(POSE_KEYS.map((k) => [k, z.number().optional()])) as Record<
      PoseKey,
      z.ZodOptional<z.ZodNumber>
    >,
  )
  .strict();

const keyBase = {
  label: nonEmpty,
  cue: nonEmpty,
  /** Milliseconds to move from the previous keyframe into this one (0 for the first). */
  duration: z.number().int().nonnegative(),
};

const figureKey = z
  .object({ ...keyBase, linear: z.boolean().optional(), pose: poseOverrides })
  .strict();
const gripKey = z.object({ ...keyBase, grip: z.enum(['forehand', 'backhand']) }).strict();

const shuttleFlight = z
  .object({
    /** Index of the keyframe at which the racket meets the shuttle. */
    contactKey: z.number().int().nonnegative(),
    from: vec2,
    arcIn: z.number(),
    inDuration: z.number().positive(),
    to: vec2,
    arcOut: z.number(),
    outDuration: z.number().positive(),
  })
  .strict();

const lessonBase = {
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lowercase kebab-case'),
  level: z.enum(['Foundations', 'Strokes']),
  title: nonEmpty,
  summary: nonEmpty,
  points: z.array(nonEmpty).min(2),
  mistakes: z.array(nonEmpty).min(2),
  drill: nonEmpty,
};

const timingRules = (keys: readonly { duration: number }[], ctx: z.RefinementCtx) => {
  keys.forEach((k, i) => {
    if (i === 0 && k.duration !== 0)
      ctx.addIssue({
        code: 'custom',
        path: ['keys', 0, 'duration'],
        message: 'first keyframe must have duration 0',
      });
    if (i > 0 && k.duration <= 0)
      ctx.addIssue({
        code: 'custom',
        path: ['keys', i, 'duration'],
        message: 'keyframe duration must be > 0',
      });
  });
};

const figureLesson = z
  .object({
    ...lessonBase,
    kind: z.literal('figure'),
    keys: z.array(figureKey).min(2),
    shuttle: shuttleFlight.optional(),
    netX: z.number().positive().optional(),
  })
  .strict()
  .superRefine((l, ctx) => {
    timingRules(l.keys, ctx);
    if (l.shuttle && l.shuttle.contactKey >= l.keys.length)
      ctx.addIssue({
        code: 'custom',
        path: ['shuttle', 'contactKey'],
        message: 'contactKey out of range',
      });
  });

const gripLesson = z
  .object({ ...lessonBase, kind: z.literal('grip'), keys: z.array(gripKey).min(2) })
  .strict()
  .superRefine((l, ctx) => {
    timingRules(l.keys, ctx);
  });

export const lessonSchema = z.discriminatedUnion('kind', [figureLesson, gripLesson]);

export const librarySchema = z
  .object({ version: z.literal(1), lessons: z.array(lessonSchema).min(1) })
  .strict()
  .superRefine((lib, ctx) => {
    const seen = new Set<string>();
    lib.lessons.forEach((l, i) => {
      if (seen.has(l.id))
        ctx.addIssue({
          code: 'custom',
          path: ['lessons', i, 'id'],
          message: `duplicate id "${l.id}"`,
        });
      seen.add(l.id);
    });
  });

export type LessonSource = z.infer<typeof lessonSchema>;
export type LibrarySource = z.infer<typeof librarySchema>;
