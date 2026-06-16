import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';
import { one, two, three, four, five, six } from '../assets/school/slideSchool.js';

const SlidingSchools = () => {
  return (
    <section className="bg-base/50  py-10 flex flex-col gap-16 text-center">
      {/* <h2 className="text-base-content tracking-[5px] text-sm font-semibold uppercase">
        SomeThings
      </h2> */}

      <Splide
        options={{
          type: "loop",
          drag: "free",
          gap: '1rem',
          arrows: false,
          pagination: false,
          perPage: 5,
          autoScroll: {
            pauseOnHover: false,
            pauseOnFocus: false,
            rewind: false,
            speed: -1,
          },
        }}
        extensions={{ AutoScroll }}
      >
        {[one, three, two, five, four, six].map((src, i) => (
          <SplideSlide key={i} className="flex justify-center min-w-fit">
            <img
              src={src}
              alt=""
              className="h-36 rounded-2xl shadow-md object-cover"
            />
          </SplideSlide>
        ))}
      </Splide>
    </section>
  );
};

export default SlidingSchools;