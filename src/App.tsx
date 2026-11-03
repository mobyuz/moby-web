import { MobyFace } from "./MobyFace";

const steps = [
  {
    title: "Robot sizni eshitadi",
    description: "Mikrofon ovozni qabul qiladi, kichik OLED ekran esa Moby holatini ko‘rsatadi.",
  },
  {
    title: "Windows ilovasi so‘rovni boshqaradi",
    description: "Robot kompyuterga USB orqali ulanadi. Ilova ovozli so‘rovlarni qayta ishlash uchun Moby serveriga yuboradi.",
  },
  {
    title: "Amal sizning nazoratingizda",
    description: "Masalan, Moby siz tanlagan loyiha uchun Git holatini o‘qiy olishi rejalashtirilgan. Mahalliy ruxsatlarni ilova tekshiradi.",
  },
];

export function App() {
  return (
    <>
      <a className="skip-link" href="#asosiy">Asosiy mazmunga o‘tish</a>
      <header id="yuqori" className="border-b border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-4 sm:py-5">
          <a href="#yuqori" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            <img src="/moby.svg" alt="" width="32" height="32" />
            Moby
          </a>
          <nav aria-label="Asosiy menyu" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-subtle sm:gap-x-7">
            <a className="hover:text-accent" href="#ishlash">Qanday ishlaydi</a>
            <a className="hover:text-accent" href="#maxfiylik">Maxfiylik</a>
            <a className="hover:text-accent" href="#savollar">Savollar</a>
          </nav>
        </div>
      </header>

      <main id="asosiy" tabIndex={-1}>
        <section className="shell grid items-center gap-10 py-12 sm:py-18 lg:grid-cols-2 lg:gap-12 lg:py-22" aria-labelledby="sarlavha">
          <div>
            <p className="eyebrow mb-5">Moby robot · ishlab chiqilmoqda</p>
            <h1 id="sarlavha" className="max-w-[12ch] text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] font-bold tracking-[-0.065em]">
              Stol ustidagi yordamchi robot.
            </h1>
            <p className="mt-6 max-w-[43ch] text-lg leading-relaxed text-subtle">
              Moby ovozli so‘rovlarni eshitish va Windows kompyuteringizda ruxsat bergan ishlarni bajarishga yordam berish uchun yaratilmoqda.
            </p>
            <a className="action mt-8 inline-flex items-center gap-3" href="#ishlash">
              Moby bilan tanishing <span aria-hidden="true">↓</span>
            </a>
          </div>

          <figure className="hero-display">
            <MobyFace />
            <figcaption className="display-caption">
              <span>MOBY / CORE V1</span>
              <span>Konsept</span>
            </figcaption>
          </figure>
        </section>

        <section id="ishlash" className="border-y border-line bg-panel/45" aria-labelledby="ishlash-sarlavha">
          <div className="shell py-14 sm:py-20">
            <p className="eyebrow mb-3">Robot → kompyuter → server</p>
            <h2 id="ishlash-sarlavha" className="section-title">Moby qanday ishlaydi?</h2>
            <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="bg-panel p-6 sm:p-7">
                  <span className="font-mono text-sm text-accent" aria-hidden="true">0{index + 1}</span>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-subtle">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="maxfiylik" className="shell grid gap-6 py-14 sm:py-20 md:grid-cols-2 md:gap-12" aria-labelledby="maxfiylik-sarlavha">
          <div>
            <p className="eyebrow mb-3">Maxfiylik</p>
            <h2 id="maxfiylik-sarlavha" className="section-title">Mikrofon va ma’lumotlar nazorati</h2>
          </div>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-panel px-6 leading-relaxed text-subtle">
            <li className="py-4">Jismoniy o‘chirgich mikrofonning ma’lumot yo‘lini uzadi.</li>
            <li className="py-4">Ovoz bulutga siz rozilik berganingizdan keyin yuboriladi.</li>
            <li className="py-4">Suhbat tarixi kompyuteringizda saqlanishi rejalashtirilgan.</li>
          </ul>
        </section>

        <section id="savollar" className="border-t border-line" aria-labelledby="savollar-sarlavha">
          <div className="shell grid gap-6 py-14 sm:py-20 md:grid-cols-2 md:gap-12">
            <div>
              <p className="eyebrow mb-3">Savol-javob</p>
              <h2 id="savollar-sarlavha" className="section-title">Boshlashdan oldin</h2>
            </div>
            <div className="divide-y divide-line border-y border-line">
              <details className="py-4">
                <summary className="cursor-pointer font-semibold">Qaysi kompyuterlar uchun?</summary>
                <p className="mt-3 leading-relaxed text-subtle">Birinchi desktop versiya 64 bitli Windows 10 va 11 uchun rejalashtirilgan.</p>
              </details>
              <details className="py-4">
                <summary className="cursor-pointer font-semibold">Moby’ni hozir sinab ko‘rsam bo‘ladimi?</summary>
                <p className="mt-3 leading-relaxed text-subtle">Mahsulot ishlab chiqilmoqda. Mehmon uchun matnli demo va Windows o‘rnatuvchisi keyingi bosqichlarda qo‘shiladi.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-subtle">
          <span>Moby · Mahsulot prototipi</span>
          <a className="hover:text-accent" href="#yuqori">Yuqoriga <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
    </>
  );
}
