import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
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
import { useRef } from "react";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const CATEGORIES = [
    { id: "math", label: t("categories.Mathematics"), img: math },
    { id: "english", label: t("categories.English"), img: english },
    { id: "physics", label: t("categories.Physics"), img: physics },
    { id: "softskill", label: t("categories.Soft-Skills"), img: soft_skill },
    { id: "chemistry", label: t("categories.Chemistry"), img: chem },
    { id: "datascience", label: t("categories.Data Science"), img: data_science },
    { id: "geo", label: t("categories.Geography"), img: geo },
    { id: "commerce", label: t("categories.Commerce"), img: commerce },
    { id: "medical", label: t("categories.Medical"), img: med },
    { id: "psychology", label: t("categories.Psychology"), img: psycho },
  ];

  const splideRef = useRef(null);
  const prev = () => splideRef.current?.splide?.go("<");
  const next = () => splideRef.current?.splide?.go(">");

  return (
    <section className="flex flex-col items-center py-12 px-4 bg-base/50">
      <div className="w-14 h-1 bg-primary rounded-full mb-6"  /> {/* Decorative line */}

      <h2 className="text-3xl font-bold text-primary text-center mb-3">
        {t("categories.title")}
      </h2>

      <p className="text-base-content/60 text-base text-center  mb-10 2xl:max-w-lg">
        {t("categories.description")}
      </p>

      <div className="w-full max-w-4xl flex items-center gap-2">
        <button
          className="btn btn-circle btn-sm bg-base-300 shrink-0"
          onClick={prev}
        >
          <GrFormPrevious />
        </button>

        {/*
          Bọc Splide trong div flex-1 + minWidth:0
          Nếu thiếu minWidth:0, flex child sẽ không shrink đúng
          → slide đầu bị tràn ra ngoài
        */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate(`/tutors`)}>
          <Splide
            ref={splideRef}
            options={{
              type: "slide",
              perMove: 1,
              gap: "1rem",
              pagination: false,
              arrows: false,
              /*
                fixedWidth + fixedHeight là chìa khóa:
                - Splide sẽ KHÔNG tự tính lại kích thước slide khi nội dung thay đổi
                - Đổi ngôn ngữ (text dài/ngắn) không làm co giãn layout nữa
              */
              fixedWidth: "160px",
              fixedHeight: "145px",
              focus: 0,
              trimSpace: true,
              breakpoints: {
                1280: { fixedWidth: "160px", fixedHeight: "145px" },
                1024: { fixedWidth: "150px", fixedHeight: "145px" },
                768:  { fixedWidth: "140px", fixedHeight: "145px" },
                480:  { fixedWidth: "130px", fixedHeight: "145px" },
              },
            }}
          >
            {CATEGORIES.map((cat) => (
              <SplideSlide key={cat.id}>
                <div 
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.75rem 0.5rem",
                    boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
                    /* margin nhỏ để shadow không bị clip */
                    margin: "0.2rem 0.1rem",
                    cursor: "pointer",
                    borderRadius: "1rem",
                    /* height = fixedHeight - margin dọc (0.4rem ~ 6px) */
                    height: "calc(145px - 0.4rem)",
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "var(--fallback-b1, oklch(var(--b1)/1))",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "rgba(0, 0, 0, 0.32) 0px 6px 16px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "rgba(0, 0, 0, 0.24) 0px 3px 8px";
                  }}
                >
                  <img
                    src={cat.img}
                    alt={cat.label}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      marginTop: "0.5rem",
                      fontSize: "0.8rem",
                      lineHeight: "1.3",
                      wordBreak: "break-word",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      width: "100%",
                    }}
                  >
                    {cat.label}
                  </span>
                </div>
              </SplideSlide>
            ))}
          </Splide>
        </div>

        <button
          className="btn btn-circle btn-sm bg-base-300 shrink-0"
          onClick={next}
        >
          <GrFormNext />
        </button>
      </div>
    </section>
  );
};

export default Courses;