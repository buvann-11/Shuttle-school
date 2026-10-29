import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import type { Lesson, LessonLevel } from '@/content/types';
import { CheckIcon } from '@/components/Icons';
import styles from './LessonList.module.css';

interface LessonListProps {
  lessons: readonly Lesson[];
  learned: ReadonlySet<string>;
}

export function LessonList({ lessons, learned }: LessonListProps) {
  const navRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // On the horizontal (phone) strip, scroll the current lesson into view.
  // Only the strip scrolls; the page itself never moves.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const left = active.offsetLeft - 16; // nav is the offsetParent (position: relative)
    nav.scrollTo({ left: Math.max(0, left) });
  }, [pathname]);

  const groups = new Map<LessonLevel, Lesson[]>();
  for (const l of lessons) groups.set(l.level, [...(groups.get(l.level) ?? []), l]);

  return (
    <nav ref={navRef} className={styles.list} aria-label="Lessons">
      {[...groups].map(([level, items]) => (
        <section key={level} className={styles.group} aria-labelledby={`level-${level}`}>
          <h2 id={`level-${level}`} className={`eyebrow ${styles.groupTitle}`}>
            {level}
          </h2>
          <ol className={styles.items}>
            {items.map((l) => {
              const done = learned.has(l.id);
              return (
                <li key={l.id}>
                  <NavLink to={`/lessons/${l.id}`} className={styles.item ?? ''}>
                    <span className={styles.name}>
                      <span className={styles.number} aria-hidden="true">
                        {l.number}
                      </span>
                      {l.title}
                    </span>
                    <span className={styles.tick} data-done={done}>
                      {done && <CheckIcon width={12} height={12} strokeWidth={3} />}
                      <span className="visually-hidden">{done ? ', learned' : ''}</span>
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </nav>
  );
}
