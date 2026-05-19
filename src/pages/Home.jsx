import React from "react";
import HeroSection from "../components/home/HeroSection";
import DemoSection from "../components/home/DemoSection";
import SampleSection from "../components/home/SampleSection";
import StrategicSection from "../components/home/StrategicSection";
import FaqSection from "../components/home/FaqSection";
import FeatureGridSection from "../components/home/FeatureGridSection";

const Home = () => {
  return (
    <>
      <HeroSection />
      <DemoSection />
      <SampleSection />
      <FeatureGridSection />
      <StrategicSection />
      <FaqSection />
    </>
  );
};

export default Home;
