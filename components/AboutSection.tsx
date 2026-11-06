import WindowTitle from './WindowTitle';

export default function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="window active glass">
      <WindowTitle id="about-title" icon="notepad">About · Notepad</WindowTitle>
      <div className="window-body">
        <p className="p-2 text-sm leading-relaxed text-slate-800">
          hey, i&apos;m akryst. this is my little corner of the web, dressed up like a Windows 7
          desktop. see what i&apos;ve been listening to or leave a note in the guestbook.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-300 p-2">
          <p className="text-sm text-slate-800">want a little corner of your own?</p>
          <a className="aero-link gap-2" href="https://github.com/Akryst/Aerobio"
            target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true" className="icon-[simple-icons--github] text-base" />
            Clone AeroBio on GitHub
          </a>
        </div>
      </div>
      <div className="status-bar">
        <p className="status-bar-field">about.txt</p>
      </div>
    </section>
  );
}
