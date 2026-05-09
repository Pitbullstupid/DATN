import { useRef } from "react";
import {
  commerce,
  english,
  data_science,
  physics,
  geo,
  chem,
  math,
  psycho,
  soft_skill,
  med,
} from "../assets/subjectIcons/Subjects";
import { GrNext, GrFormPrevious } from "react-icons/gr";
const CATEGORIES = [
  { id: "math", label: "Mathematics", img: math },
  { id: "english", label: "English", img: english },
  { id: "physics", label: "Physics", img: physics },
  { id: "softskill", label: "Soft-Skills", img: soft_skill },
  { id: "chemistry", label: "Chemistry", img: chem },
  { id: "datascience", label: "Data Science", img: data_science },
  { id: "geo", label: "Geography", img: geo },
  { id: "commerce", label: "Commerce", img: commerce },
  { id: "medical", label: "Medical", img: med },
  { id: "psychology", label: "Psychology", img: psycho },
];

const CourseCard = ({ img, label }) => (
  <div className="flex flex-col items-center p-4 rounded-2xl shadow-md bg-base-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer min-w-32.5 mx-2">
    <img src={img} alt={label} className="w-20 h-20 object-contain" />
    <span className="mt-2 text-sm font-bold text-center text-base-content">
      {label}
    </span>
  </div>
);

const Courses = () => {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  };
  

  return (
    <section className="flex flex-col items-center py-12 px-4 bg-base-200">
      <div className="w-12 h-1 bg-primary rounded-full mb-6" />

      <h2 className="text-3xl font-bold text-primary text-center mb-3">
        Browse Course by Categories
      </h2>

      <p className="text-base-content/60 text-base text-center max-w-sm mb-10">
        Browse through some of our specialized courses
      </p>

      <div className="relative w-full max-w-4xl flex items-center gap-2">
        <button
          className="btn btn-circle bg-base-300 btn-base btn-sm shrink-0 "
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
        >
          <GrFormPrevious />
        </button>

        <div
          ref={trackRef}
          className="flex overflow-x-auto gap-3 scroll-smooth py-3 px-1 flex-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <CourseCard key={cat.id} img={cat.img} label={cat.label} />
          ))}
        </div>

        <button
          className="btn btn-circle bg-base-300 btn-base btn-sm shrink-0 "
          onClick={() => scroll(1)}
          aria-label="Scroll right"
        >
          <GrNext />
        </button>
      </div>
    </section>
  );
};

export default Courses;
