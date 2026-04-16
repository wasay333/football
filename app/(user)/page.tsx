import { prisma } from "@/prisma";
import HeroSection from "@/components/hero-section";

export const dynamic = "force-dynamic";
import AboutSection from "@/components/about-section";
import CrownSection from "@/components/crown-section";
import LegendSection from "@/components/legend-section";
import BestsellingSection from "@/components/bestselling-section";

const LandingPage = async () => {
  const [footballers, bestsellers] = await Promise.all([
    prisma.footballer.findMany({
      take: 4,
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, profileImage: true, bio: true },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        capImage1: true,
        footballer: { select: { name: true } },
      },
    }),
  ]);

  return (
    <>
      <HeroSection />
      <AboutSection />
      <CrownSection />
      <LegendSection footballers={footballers} />
      <BestsellingSection products={bestsellers} />
    </>
  );
};

export default LandingPage;
