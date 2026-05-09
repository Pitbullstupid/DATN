import React, { useState } from "react";
import logo from "../assets/logoDATN.png";
import { Link, useNavigate } from "react-router-dom";
import ModalLogin from "./ModalLogin.jsx";
import ThemeSelector from "./ThemeSelector.jsx";
import { useAuth } from "../context/AuthContext";
import avatar from "../assets/DefaultAvatar.jpg";
import { CgProfile } from "react-icons/cg";
import { LuLogOut } from "react-icons/lu";

const Navbar = () => {
  const [modalMode, setModalMode] = useState("login");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const openModal = (mode) => {
    setModalMode(mode);
    document.getElementById("modal_login").showModal();
  };

  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />{" "}
            </svg>
          </div>
          <ul
            tabIndex="-1"
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li>
              <a>Item 1</a>
            </li>
            <li>
              <a>Parent</a>
              <ul className="p-2">
                <li>
                  <a>Submenu 1</a>
                </li>
                <li>
                  <a>Submenu 2</a>
                </li>
              </ul>
            </li>
            <li>
              <a>Item 3</a>
            </li>
          </ul>
        </div>
        <img src={logo} alt="Logo" className="h-8 w-8" />
        <a className="btn btn-ghost text-xl" onClick={() => navigate("/")}>
          TutorConnect
        </a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a>Item 1</a>
          </li>
          <li>
            <details>
              <summary>Parent</summary>
              <ul className="p-2 bg-base-100 w-40 z-1">
                <li>
                  <a>Submenu 1</a>
                </li>
                <li>
                  <a>Submenu 2</a>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <a>Item 3</a>
          </li>
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <ThemeSelector />

        {user ? (
          // Đã đăng nhập → hiển thị avatar + dropdown
          <>
            <span className="text-sm font-bold truncate max-w-25 sm:max-w-40 md:max-w-50 lg:max-w-60">
              Xin chào, {user?.name?.toUpperCase()}
            </span>
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar placeholder"
              >
                <div className="bg-info text-info-content w-10 rounded-full">
                  <img src={user?.avatar || avatar} alt="Avatar" />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
              >
                <li className="menu-title px-2 py-1">
                  <span className="text-xs text-base-content/60">
                    {user?.email}
                  </span>
                </li>
                <li>
                  <Link to="/profile">
                    <CgProfile /> Hồ sơ
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigate("/");
                      logout();
                    }}
                  >
                    <LuLogOut /> Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          // Chưa đăng nhập → hiển thị nút Login / Sign Up
          <>
            <button className="btn btn-info" onClick={() => openModal("login")}>
              Login
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => openModal("signup")}
            >
              Sign Up
            </button>
          </>
        )}
      </div>

      <ModalLogin mode={modalMode} onSwitchMode={setModalMode} />
    </div>
  );
};

export default Navbar;
