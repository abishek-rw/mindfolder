
"use client";
import React, { useState } from "react";
import Image from 'next/image';
import leftarrow from "../assets/left-arrows.svg";
import fsf from "../assets/freespacefolder.svg";

const FreeSpace = ({ onBack }) => {
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAddEmail = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const email = inputValue.trim();
      if (email && validateEmail(email)) {
        if (!emails.includes(email)) {
          setEmails([...emails, email]);
          setInputValue("");
        } else {
          alert("This email is already added.");
        }
      }
    }
  };

  const handleRemoveEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendInvite = () => {
    if (emails.length > 0) {
      setSuccessMessage("Email sent successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      alert("Please add at least one email.");
    }
  };

  return (
    <div className="flex flex-col h-screen px-4 relative">
      {/* Top Header Section */}
      <div className="w-full flex items-center fixed top-0 left-0 p-4 z-50">
        <button className="p-2" onClick={onBack}>
          <Image src={leftarrow} width={42} height={42} alt="leftarrow" />
        </button>
        <h1 className="text-lg font-semibold text-gray-700 ml-2">Free Space</h1>
      </div>

      {/* Main Content Container with Fixed Heights */}
      <div className="flex flex-col items-center mt-16">
        {/* Image Section with Fixed Height */}
        <div className="h-44 flex items-center justify-center">
          <Image src={fsf} alt="Folders" className="h-56 w-56" />
        </div>

        {/* Text Section with Fixed Height */}
        <div className="h-14 flex items-center justify-center">
          <p className="text-center text-black font-normal">
            <span className="block">Invite 5 friends to join and earn an</span><span>
            <span className="font-bold text-black"> 100 MB of free storage!</span></span>
          </p>
        </div>

        {/* Email Input Section */}
        <div className="w-full mt-4">
          <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
            Email
          </label>
          <div className="w-full flex flex-wrap max-h-[150px] overflow-y-auto items-center gap-2 p-[6px]  
                          rounded-lg bg-[#C8C8C84D] shadow-[0px_1px_5.3px_0px_rgba(0,0,0,0.59)_inset,0px_1px_1px_0px_#FFFFFF]">
            {emails.map((email, index) => (
              <div key={index} className="flex items-center bg-white text-sm px-3 py-1 rounded-lg shadow-md"
               style={{
                background:
                "linear-gradient(180deg, #FFFFFF 0%, #ECECEC 100%)",
              
              boxShadow: `
              0px 1.12px 4.5px 1.12px #0000001F, 
              0px 3.37px 3.65px -1.69px #00000040, 
              0px 0px 0.28px 0.84px #0000000D, 
              0px 0px 0.28px 0.28px #00000012
            `,
          
          }}>
                {email}
                <button className="ml-2 text-black" onClick={() => handleRemoveEmail(index)}>
                  &times;
                </button>
              </div>
            ))}
            <input
              type="email"
              id="email"
              value={inputValue}
              placeholder={!inputValue && emails.length === 0 ? "Add your friend's and family's emails." : ''}
              className="flex-1 h-[50px] bg-transparent border-none outline-none text-[#757575] 
                         placeholder:text-[#303030] p-2   leading-[1.2] overflow-y-auto"
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleAddEmail}
            />
          </div>
        </div>

        {/* Send Invite Button */}
        <button
          onClick={handleSendInvite}
          className="mt-4 w-full bg-[#334998] text-white font-semibold py-3 rounded-lg shadow-lg transition duration-300"
          style={{
            boxShadow: "0px 1.91px 3.75px 0px #FFFFFF87 inset, 0px 5.73px 9.55px 0px #00000066",
          }}
        >
          Send Invite
        </button>

        {/* Success Message */}
        {successMessage && <p className="mt-4 text-green-600 text-sm">{successMessage}</p>}
      </div>
    </div>
  );
};

export default FreeSpace;