const Notification = ({ message, type,onClose }) => (
  <div
  className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white z-50 flex items-center gap-4 transition-all duration-300 ease-in-out ${
    type === "success" ? "bg-[#489226]" : "bg-[#f32a2ac7]"
  } animate-fade-in`}
>
  <span className="text-sm font-medium">{message}</span>
  <button
    className="text-white text-lg font-bold transition-transform duration-200 hover:scale-110"
    onClick={onClose}
  >
    ✖
  </button>
</div>

  );
  
  export default Notification;
  