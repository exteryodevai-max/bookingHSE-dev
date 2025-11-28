import React from 'react';
import Layout from '../components/Layout/Layout';
import Hero from '../components/Home/Hero';
import ServiceCategories from '../components/Home/ServiceCategories';
import HowItWorks from '../components/Home/HowItWorks';
import FeaturedProviders from '../components/Home/FeaturedProviders';

export default function Home() {
  return (
    <Layout>
      <Hero />
      <ServiceCategories />
      <HowItWorks />
      <FeaturedProviders />
    </Layout>
  );
}