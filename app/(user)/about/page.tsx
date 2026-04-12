export const metadata = {
  title: "About Us | Foocaps",
  description: "Learn about Foocaps — football-inspired headwear crafted for true fans.",
};

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <p className="about-eyebrow">Our Story</p>
          <h1 className="about-title">
            Born From <span>The Beautiful Game</span>
          </h1>
          <p className="about-subtitle">
            Foocaps was founded by fans, for fans. Every cap in our collection
            pays tribute to the footballers who defined generations.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="about-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">Our Mission</h2>
          <p className="about-section-body">
            We believe football is more than a sport — it&apos;s a culture, a language, and
            a legacy. Our caps are designed to let you carry that legacy wherever you go.
            Each piece is crafted with premium materials and inspired by the icons who
            shaped the game.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="about-values-inner">
          {[
            {
              title: "Quality First",
              body: "Premium materials, precise stitching, and a fit that lasts — every cap is built to the same standard we hold our football heroes to.",
            },
            {
              title: "Fan-Led Design",
              body: "Our designs come straight from the terrace. Real fans, real passion, real style.",
            },
            {
              title: "Iconic Tributes",
              body: "Every cap tells a story — from the golden boots to the iconic shirts, we capture the essence of football&apos;s greatest.",
            },
          ].map((v) => (
            <div key={v.title} className="about-value-card">
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <h2>Ready to wear the legacy?</h2>
        <a href="/product" className="about-cta-btn">Shop the Collection</a>
      </section>
    </div>
  );
}
