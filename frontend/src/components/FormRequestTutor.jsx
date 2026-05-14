import React from "react";
import { Toaster } from "react-hot-toast";

const FormRequestTutor = () => {
  return (
    <dialog id="modal_request_tutor" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg">Hello!</h3>
        <p className="py-4">Press ESC key or click on ✕ button to close</p>
      </div>
    </dialog>
  );
};

export default FormRequestTutor;
