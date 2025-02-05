"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import leftarrow from "../assets/left-arrows.svg";
import thumbnaill from "../assets/thumbnailpdf.svg";
import pdf from "../assets/PDF.svg";
import share from "../assets/Share.svg";
import sharefolder from "../assets/sharefolder.svg";
import save from "../assets/save.svg";
import messages from "../assets/messages.svg";
import whatsapp from "../assets/whatsapp.svg";
import gmail from "../assets/gmail.svg";
import telegram from "../assets/telegram.svg";
import drive from "../assets/drive.svg";

const RecentContacts = () => {
  const contacts = [
    { name: "Albert", initial: "A", bgColor: "bg-blue-600" },
    { name: "Mickey", initial: "M", bgColor: "bg-green-500" },
    { name: "Steve", initial: "S", bgColor: "bg-pink-500" },
    { name: "Louis", initial: "L", bgColor: "bg-orange-500" },
  ];

  return (
    <div className="flex justify-center gap-6 ">
      {contacts.map((contact, index) => (
        <div key={index} className="flex flex-col items-center space-y-2">
          <div className={`w-14 h-14 ${contact.bgColor} text-white flex items-center justify-center rounded-full relative`}>
            <span className="text-lg font-bold">{contact.initial}</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Image
                src={gmail}
                alt="Gmail Icon"
                width={16}
                height={16}
              />
            </div>
          </div>
          <p className="text-sm font-medium text-[#757575]">{contact.name}</p>
        </div>
      ))}
    </div>
  );
};

const CertificatesView = ({ onBack, allFiles }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const containerRef = useRef(null);
  let longPressTimeout = null;

  const handleFileSelect = (file) => {
    setSelectedFiles((prevSelected) => {
      if (prevSelected.includes(file)) {
        return prevSelected.filter((f) => f !== file);
      } else {
        return [...prevSelected, file];
      }
    });
  };

  const handleLongPressStart = () => {
    longPressTimeout = setTimeout(() => setShowCheckboxes(true), 500);
  };


  const handleLongPressEnd = () => {
    clearTimeout(longPressTimeout);
  };

  const handleShare = () => {
    setShowSharePicker(true);
  };

  const closeSharePicker = () => {
    setShowSharePicker(false);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="text-sm text-[#1E1E1E] font-semibold text-[18px] flex items-center"
          >
            <Image
              src={leftarrow}
              alt="back"
              width={42}
              height={42}
              className="mr-2"
            />
            <span>Certificates</span>
          </button>
        </div>
      </div>

      {/* Files List */}
      <div
        ref={containerRef}
        className="flex-1 px-6 overflow-y-auto"
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      >
        {allFiles.map((file, index) => {
          const isSelected = selectedFiles.includes(file);
          const borderColor = isSelected ? "border-pink-500" : "border-pink-200";

          return (
            <div
              key={index}
              className={`flex flex-col items-start ${borderColor} border-2 p-3 rounded mb-2 shadow-sm`}
              style={{
                width: "334px",
                padding: "8px",
                gap: "6px",
                borderRadius: "5px",
                boxShadow: isSelected
                  ? "0px 4px 4px 0px #00000026"
                  : "1px 6px 8px 0px #827C7A80",
                backgroundColor: "#FFFFFF",
              }}
            >
              {/* Checkbox and Text Row */}
              <div className="flex items-center w-full">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleFileSelect(file)}
                    className="form-checkbox h-4 w-4 text-pink-500 border-pink-500 focus:ring-pink-500 mr-2"
                    style={{
                      accentColor: "#FF007F",
                    }}
                  />
                )}
                <div className="flex items-center space-x-2">
                  <Image src={pdf} alt="PDF" width={24} height={24} />
                  <div>
                    <div className="font-medium text-[#5A5A5A]">{file.name}</div>
                  </div>
                </div>
              </div>

              {/* Thumbnail Image */}
              <div className="w-full mt-2">
                <Image
                  src={thumbnaill}
                  alt="thumbnail"
                  className="rounded-lg"
                  style={{ width: "100%", height: "150px", objectFit: "cover" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Button */}
      {selectedFiles.length > 0 && (
        <div className="flex shadow-inner flex-row bg-[rgba(0,0,0,0.03)]">
          <button onClick={handleShare} className="flex-shrink-0 px-4">
            <Image src={share} alt="share" className="rounded-full"/>
          </button>
          <div className="relative flex pl-14 py-4  flex-shrink-0 w-full">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedFiles.length} out of {allFiles.length} files
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Share Picker Modal */}
      {showSharePicker && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end "
          onClick={closeSharePicker}
        >
          <div
            className="w-full h-1/2 bg-white rounded-t-xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Folder Information */}
            <div className="flex items-center gap-4 ">
              <Image src={sharefolder} alt="Folder" width={45} height={36} />
              <div>
                <h3 className="text-lg font-normal text-[#5A5A5A] ">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
                </h3>
                {/* <span className="text-xs text-[#5A5A5A] ">2 files</span> */}
              </div>
            </div>

            {/* Recent Contacts */}
            <RecentContacts />

            {/* App Shortcuts */}
            <div>
             
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center">
                  <Image src={messages} alt="Messages" width={54} height={54} />
                  <span className="text-xs mt-1 text-[#757575] font-semibold">Messages</span>
                </div>
                <div className="flex flex-col items-center">
                  <Image src={gmail} alt="Gmail" width={54} height={54} />
                  <span className="text-xs mt-1 text-[#757575] font-semibold">Gmail</span>
                </div>
                <div className="flex flex-col items-center">
                  <Image src={whatsapp} alt="WhatsApp" width={54} height={54} />
                  <span className="text-xs mt-1 text-[#757575] font-semibold">WhatsApp</span>
                </div>
                <div className="flex flex-col items-center">
                  <Image src={telegram} alt="Telegram" width={54} height={54} />
                  <span className="text-xs mt-1 text-[#757575] font-semibold">Telegram</span>
                </div>
                <div className="flex flex-col items-center">
                  <Image src={drive} alt="Drive" width={54} height={54} />
                  <span className="text-xs mt-1 text-[#757575] font-semibold">Drive</span>
                </div>
              </div>
            </div>

            {/* Save to Files Button */}
            <button className="w-full bg-[#334998] font-semibold  text-[12px] text-[#F5F5F5] py-3 px-4 rounded-lg flex justify-between items-center gap-2">
              <span>Save to Files</span>
              <Image src={save} alt="Download" width={18} height={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesView;