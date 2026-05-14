import React from 'react'
import Banner from '../components/Banner'
import SlidingImages1 from '../components/SlidingImages1'
import SlidingSchools from '../components/SlidingSchools'
import Subjects from '../components/Subjects'

const Homepage = () => {
  return (
    <div className='h-1000 overflow-x-hidden'>
      <Banner/>
      <SlidingImages1/>
      <SlidingSchools/>
      <Subjects/>
    </div>
  )
}

export default Homepage