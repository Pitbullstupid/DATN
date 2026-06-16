import React from "react";
import Banner from "../components/Banner";
import SlidingImages1 from "../components/SlidingImages1";
import SlidingSchools from "../components/SlidingSchools";
import Subjects from "../components/Subjects";
import FeaturedTutors from "../components/FeaturedTutors";
import StatsBar from "../components/StatsBar";

const Homepage = () => {
  return (
    <div className=" overflow-x-hidden">
      <Banner />
      <FeaturedTutors />
      {/* <SlidingImages1/> */}
      <SlidingSchools />
      <Subjects />
      <StatsBar />
    </div>
  );
};

export default Homepage;
