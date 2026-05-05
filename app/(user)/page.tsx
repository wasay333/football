import type { Metadata } from "next";
import { prisma } from "@/prisma";
import HeroSection from "@/components/hero-section";
import Loader from "@/components/loader";

export const dynamic = "force-dynamic";
import PromoBanner from "@/components/promo-banner";
import BentoBannerSection from "@/components/bento-banner-section";
import LegendSection from "@/components/legend-section";
import BestsellingSection from "@/components/bestselling-section";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://foocaps.com").replace(/\/$/, "");
const searchPreviewPath = "/search-preview.png";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: searchPreviewPath,
        width: 1200,
        height: 1200,
        alt: "Foocaps featured World Cup 2026 cap collection",
      },
    ],
  },
  twitter: {
    images: [searchPreviewPath],
  },
};

const LandingPage = async () => {
  const [footballers, preorders, bestsellers] = await Promise.all([
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
      where: {
        status: "ACTIVE",
        stock: 0,
        allowPreorder: true,
        capImage1: { not: null },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        capImage1: true,
        description: true,
        stock: true,
        allowPreorder: true,
        footballer: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        stock: { gt: 0 },
        capImage1: { not: null },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        capImage1: true,
        description: true,
        stock: true,
        allowPreorder: true,
        footballer: { select: { name: true } },
      },
    }),
  ]);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Foocaps",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/foocaps-search-favicon.png`,
          width: 512,
          height: 512,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Foocaps",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: "Foocaps - The Jersey Evolved",
        isPartOf: {
          "@id": `${siteUrl}/#website`,
        },
        about: {
          "@id": `${siteUrl}/#organization`,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${siteUrl}${searchPreviewPath}`,
          width: 1200,
          height: 1200,
        },
        image: [
          `${siteUrl}${searchPreviewPath}`,
          `${siteUrl}/rem1.png`,
          `${siteUrl}/rem2.png`,
          `${siteUrl}/rem3.png`,
        ],
      },
    ],
  };

  return (
    <div className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Loader />
      <HeroSection />
      <PromoBanner />
      <BentoBannerSection />
      <LegendSection footballers={footballers} />
      <BestsellingSection
        title="PRE"
        highlight="ORDER"
        variant="preorder"
        products={preorders.map((p) => ({ ...p, price: Number(p.price) }))}
      />
      <BestsellingSection
        products={bestsellers.map((p) => ({ ...p, price: Number(p.price) }))}
      />
    </div>
  );
};

export default LandingPage;
