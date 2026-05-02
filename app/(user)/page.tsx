import { prisma } from "@/prisma";
import HeroSection from "@/components/hero-section";
import Loader from "@/components/loader";

export const dynamic = "force-dynamic";
import PromoBanner from "@/components/promo-banner";
import BentoBannerSection from "@/components/bento-banner-section";
import LegendSection from "@/components/legend-section";
import BestsellingSection from "@/components/bestselling-section";

const LandingPage = async () => {
  const [footballers, bestsellers] = await Promise.all([
    prisma.footballer.findMany({
      take: 4,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        profileImage: true,
        bio: true,
        products: {
          take: 1,
          where: { capImage1: { not: null } },
          orderBy: { createdAt: "desc" },
          select: { id: true, capImage1: true },
        },
      },
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
        description: true,
        footballer: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="home-page">
      <Loader />
      <HeroSection />
      <PromoBanner />
      <BentoBannerSection />
      <LegendSection footballers={footballers} />
      <BestsellingSection products={bestsellers.map(p => ({ ...p, price: Number(p.price) }))} />
    </div>
  );
};

export default LandingPage;
