import type { ReactNode } from 'react';

const icons = {
  profile: 'icon-[pixelarticons--contact]',
  guestbook: 'icon-[pixelarticons--message-text]',
  music: 'icon-[pixelarticons--play]',
  notepad: 'icon-[pixelarticons--file-text]',
};

export default function WindowTitle({
  id,
  icon,
  children,
}: { id: string; icon: keyof typeof icons; children: ReactNode }) {
  return (
    <div className="title-bar">
      <h2 id={id} className="title-bar-text">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={`shrink-0 text-base ${icons[icon]}`} />
          {children}
        </span>
      </h2>
      <div className="title-bar-controls self-start" aria-hidden="true" inert>
        <button type="button" aria-label="Minimize" />
        <button type="button" aria-label="Maximize" />
        <button type="button" aria-label="Close" />
      </div>
    </div>
  );
}
