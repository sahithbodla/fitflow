import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  AtSign,
  Mail,
  MapPin,
  MonitorSmartphone,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark, BrandWordmark } from "@/components/branding/brand-mark";
import { getBrandSettings } from "@/lib/settings";

const SERVICES = [
  {
    icon: Dumbbell,
    title: "Gym membership",
    description:
      "Full access to the floor with flexible plan durations and straightforward renewals.",
    points: ["Flexible plan lengths", "Simple renewals", "Clear expiry dates"],
  },
  {
    icon: UserRound,
    title: "Personal training",
    description:
      "One-to-one sessions built around your starting point, schedule and goal.",
    points: ["1:1 coaching", "Programme built for you", "Technique focus"],
  },
  {
    icon: MonitorSmartphone,
    title: "Online coaching",
    description:
      "Training and nutrition guidance delivered remotely, with regular check-ins.",
    points: ["Custom workout plan", "Diet guidance", "Weekly check-ins"],
  },
];

const HOW_IT_WORKS = [
  {
    title: "Send an enquiry",
    description: "Tell us your goal and how to reach you. Takes under a minute.",
  },
  {
    title: "We get in touch",
    description:
      "A quick conversation to understand where you are and what you want.",
  },
  {
    title: "Start training",
    description:
      "Pick the option that fits, and get a plan you can actually stick to.",
  },
];

// Branding is read from the database on every request, so this route must not
// be baked into the build output.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const brand = await getBrandSettings();
  const hasContact = Boolean(
    brand.contactPhone ||
      brand.contactEmail ||
      brand.addressLine ||
      brand.city ||
      brand.instagramHandle,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <BrandWordmark brand={brand} size={30} />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Staff login</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-brand text-brand-foreground hover:bg-brand-strong"
            >
              <Link href="/lead">Enquire</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60rem 30rem at 50% -8rem, var(--brand-soft), transparent 70%)",
            }}
          />
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <span className="bg-brand-soft text-brand inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                <Dumbbell className="size-3.5" />
                Gym · Personal training · Online coaching
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                {brand.tagline || `Train with ${brand.businessName}.`}
              </h1>

              <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base text-pretty sm:text-lg">
                Whether you want to train on the floor, work one-to-one with a
                coach, or follow a plan from anywhere — tell us your goal and
                we&rsquo;ll take it from there.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-brand text-brand-foreground hover:bg-brand-strong w-full sm:w-auto"
                >
                  <Link href="/lead">
                    Start your enquiry
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {brand.contactPhone ? (
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <a href={`tel:${brand.contactPhone.replace(/\s+/g, "")}`}>
                      <Phone className="size-4" />
                      Call us
                    </a>
                  </Button>
                ) : null}
              </div>

              <p className="text-muted-foreground mt-4 text-xs">
                No payment required to enquire.
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-t">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Three ways to train
              </h2>
              <p className="text-muted-foreground mt-3 text-pretty">
                Pick what fits your schedule. You can switch or combine later.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.title}
                    className="bg-card flex flex-col rounded-xl border p-6"
                  >
                    <span
                      className="bg-brand-soft text-brand mb-4 grid size-10 place-items-center rounded-lg"
                      aria-hidden
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-medium">{service.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm text-pretty">
                      {service.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {service.points.map((point) => (
                        <li
                          key={point}
                          className="text-muted-foreground flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="text-brand mt-0.5 size-4 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/40 border-t">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className="bg-brand text-brand-foreground grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm text-pretty">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <div className="bg-brand text-brand-foreground rounded-2xl px-6 py-12 text-center sm:px-12">
              <CalendarCheck className="mx-auto size-8 opacity-90" aria-hidden />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Ready when you are
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm opacity-90 text-pretty sm:text-base">
                Send us your details and we&rsquo;ll get back to you with the
                options that suit your goal.
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="mt-7 w-full sm:w-auto"
              >
                <Link href="/lead">
                  Enquire now
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-5 py-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandMark brand={brand} size={32} />
                <span className="font-semibold tracking-tight">
                  {brand.businessName}
                </span>
              </div>
              {brand.tagline ? (
                <p className="text-muted-foreground mt-3 max-w-xs text-sm text-pretty">
                  {brand.tagline}
                </p>
              ) : null}
            </div>

            {hasContact ? (
              <div className="space-y-2.5 text-sm">
                {brand.contactPhone ? (
                  <a
                    href={`tel:${brand.contactPhone.replace(/\s+/g, "")}`}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    <Phone className="size-4" />
                    {brand.contactPhone}
                  </a>
                ) : null}
                {brand.contactEmail ? (
                  <a
                    href={`mailto:${brand.contactEmail}`}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    <Mail className="size-4" />
                    {brand.contactEmail}
                  </a>
                ) : null}
                {brand.instagramHandle ? (
                  <a
                    href={`https://instagram.com/${brand.instagramHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    <AtSign className="size-4" />
                    {brand.instagramHandle.replace(/^@/, "")}
                  </a>
                ) : null}
                {brand.addressLine || brand.city ? (
                  <p className="text-muted-foreground flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {[brand.addressLine, brand.city].filter(Boolean).join(", ")}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="text-muted-foreground mt-8 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {brand.businessName}
            </p>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
