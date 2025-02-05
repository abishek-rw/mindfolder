"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import "../styles/global.css";
import uploadd from "../assets/uploadfile.svg";
import microphonee from "../assets/microphone.svg";
import leftarrow from "../assets/left-arrows.svg";
import freespacee from "../assets/freespace.svg";
import red from "../assets/redfolder.svg";
import green from "../assets/greenfolder.svg";
import yellow from "../assets/yellowfolder.svg";
import homee from "../assets/home.svg";
import askme from "../assets/askme.svg";
import profilee from "../assets/profile.svg";
import pdf from "../assets/PDF.svg";
import doc from "../assets/DOC.svg";
import jpg from "../assets/JPG.svg";
import defaultIcon from "../assets/default-icon.png";
import share from "../assets/Share.svg";
import thumbnaill from "../assets/thumbnailpdf.svg";
import CertificatesView from "./certificatesView";
import pinkhomee from "../assets/pinkhome.svg";
import pinkaskme from "../assets/pinkaskme.svg";
import pinkprofile from "../assets/pinkprofile.svg";
import messages from "../assets/messages.svg";
import whatsapp from "../assets/whatsapp.svg";
import gmail from "../assets/gmail.svg";
import telegram from "../assets/telegram.svg";
import drive from "../assets/drive.svg";
import save from "../assets/save.svg";
import FreeSpace from "./freespace";
const MAX_STORAGE = 100; // Max storage in MB
import {
  fetchFolders,
  fetchFolderSize,
  uploadFiles,
  askMindfolder,
} from "../services/api";
import Notification from "../components/Notification";
import Loader from "../components/Loader";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import arrowIcon from "../assets/arrow.png";
import Chat from "../components/Chat";

const FirstPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState("Home");
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedFolderName, setSelectedFolderName] = useState("");
  const [showFreeSpace, setShowFreeSpace] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [askmee, setAskmee] = useState(false);
  const [showCertificates, setShowCertificates] = useState(false);
  const [activePage, setActivePage] = useState("Home");
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState();
  const [storedFolders, setStoredFolders] = useState({});
  const [userEmail, setUserEmail] = useState(Cookies.get("email"));
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [finalUserPrompt, setFinalUserPrompt] = useState("");
  const [folderSelected, setFolderSelected] = useState("");
  const [llmResponse, setLlmResponse] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const session_id = Cookies.get("session_id");

      if (!session_id) {
        // router.push("/");
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const folders = await fetchFolders(userEmail);
        const storageUsed = await fetchFolderSize(userEmail);
        if (folders) {
          setStoredFolders(folders);
        }
        if (storageUsed) {
          setStorageUsed(storageUsed);
        }
        console.log(folders);
        console.log(storageUsed);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [userEmail, isAuthenticated,loading]);

  // if (!isAuthenticated) {
  //   return null;
  // }

  const handleButtonClick = () => {
    setShowFreeSpace(true); // Update the state to render the FreeSpace component
  };
  const RecentContacts = () => {
    const contacts = [
      { name: "Ashish", initial: "A", bgColor: "bg-blue-600" },
      { name: "Ruchitha", initial: "R", bgColor: "bg-green-500" },
      { name: "Amaraja", initial: "A", bgColor: "bg-pink-500" },
      { name: "Chan", initial: "C", bgColor: "bg-orange-500" },
    ];

    return (
      <div className="flex justify-center gap-6 ">
        {contacts.map((contact, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <div
              className={`w-14 h-14 ${contact.bgColor} text-white flex items-center justify-center rounded-full relative`}
            >
              <span className="text-lg font-bold">{contact.initial}</span>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <Image src={gmail} alt="Gmail Icon" width={16} height={16} />
              </div>
            </div>
            <p className="text-sm font-medium text-[#757575]">{contact.name}</p>
          </div>
        ))}
      </div>
    );
  };

  const handleUpload = async () => {
    // Create a file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = ALLOWED_FILE_TYPES.join(",");

    // Handle file selection
    fileInput.onchange = async (event) => {
      const files = Array.from(event.target.files);

      // Filter files by allowed types
      const filteredFiles = files.filter((file) => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          alert(`File type not allowed: ${file.name}`);
          return false;
        }
        return true;
      });

      // Check for duplicate files
      const duplicateFiles = [];
      const nonDuplicateFiles = filteredFiles.filter((file) => {
        const isDuplicate = uploadedFiles.some(
          (uploadedFile) =>
            uploadedFile.name === file.name &&
            uploadedFile.size === file.size / (1024 * 1024) &&
            uploadedFile.lastModified === file.lastModified
        );

        if (isDuplicate) {
          duplicateFiles.push(file.name);
          return false;
        }
        return true;
      });

      // Notify user about duplicate files
      if (duplicateFiles.length > 0) {
        const message =
          duplicateFiles.length === 1
            ? `File already uploaded: ${duplicateFiles[0]}`
            : `The following files are already uploaded:\n- ${duplicateFiles.join(
                "\n- "
              )}`;
        alert(message);
      }

      // Calculate total size of new files
      const newFilesTotalSize = nonDuplicateFiles.reduce(
        (acc, file) => acc + file.size / (1024 * 1024),
        0
      );

      // Check storage limit
      if (storageUsed + newFilesTotalSize > MAX_STORAGE) {
        alert(
          `Cannot upload files. Total size exceeded ${MAX_STORAGE}MB storage limit.`
        );
        return;
      }

      // Upload files
      setLoading(true);
      try {
        const response = await uploadFiles(nonDuplicateFiles, userEmail);
        if (response?.message === "File uploaded successfully") {
          setNotification({
            message: "File uploaded successfully.",
            type: "success",
          });
        } else {
          setNotification({
            message: "Error while uploading.",
            type: "error",
          });
        }
      } catch (error) {
        setNotification({
          message: `Upload failed: ${error.message}`,
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    // Trigger file input dialog
    fileInput.click();
  };
  const handleNavigation = (page) => {
    setActivePage(page);
    setShowFreeSpace(false);

    if (page === "Home") {
      setActiveCategory(null);
      setSelectedFolderName("");
      setAskmee(false); // Ensure askmee is false when navigating away from "Ask me"
    } else if (page === "Ask me") {
      setAskmee(true); // Set askmee to true for "Ask me"
      setShowFreeSpace(false);
    } else if (page === "Profile") {
      setAskmee(false); // Ensure askmee is false for "Profile"
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFiles((prevSelectedFiles) => {
      if (prevSelectedFiles.includes(file)) {
        return prevSelectedFiles.filter((f) => f !== file);
      } else {
        return [...prevSelectedFiles, file];
      }
    });
  };

  let longPressTimeout = null;

  // const handleShare = () => {
  //   setShowSharePicker(true);
  // };

  const handleShare = async () => {
    if (navigator.share) {
      
      try {
        await navigator.share({
          title: "Share Files",
          text: `I've selected ${selectedFiles.length} file${
            selectedFiles.length > 1 ? "s" : ""
          }`,
          url: window.location.href, // Replace with the relevant shareable link
        });
        console.log("Content shared successfully!");
      } catch (error) {
        console.error("Error sharing content:", error);
      }
    } else {
      console.log("Web Share API not supported in this browser.");
      // Optionally, fall back to your custom share picker here
    }
  };

  const closeSharePicker = () => {
    setShowSharePicker(false);
  };

  const handleLongPressStart = () => {
    longPressTimeout = setTimeout(() => setShowCheckboxes(true), 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressTimeout);
  };

  const toggleView = (viewType) => {
    if (viewType === "grid") {
      setIsGridView(true);
    } else {
      setIsGridView(false);
    }
  };

  const handleSelectAll = () => {
    // setSelectAll(!selectAll);
  };

  const handleFolderClick = async (folderName) => {
    setFolderSelected(folderName);
  };

  const handleSliderClick = () => {
    setTooltipVisible(true);
    setTimeout(() => setTooltipVisible(false), 2000);
  };

  const totalStorageUsed = uploadedFiles.reduce(
    (acc, file) => acc + file.size,
    0
  );

  const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "text/plain",
  ];
  const goToAskme = () => {
    setAskmee((prevState) => !prevState); // Toggle the state
  };

  const allFiles = [
    { id: 1, name: "Ultimate Fitness Champion Certificate", type: "pdf" },
    { id: 2, name: "Elite Health Excellence Certificate", type: "pdf" },
    { id: 3, name: "Serenity Springs Wellness Certificate", type: "pdf" },
    { id: 4, name: "Health Triumph Award Certificate", type: "pdf" },
    { id: 5, name: "Additional Certificate 1", type: "pdf" },
    { id: 6, name: "Additional Certificate 2", type: "pdf" },
  ];

  const handleQuery = async () => {
    if (activePage !== "Ask me") {
      handleNavigation("Ask me");
    }
    setFinalUserPrompt(userPrompt);
    setUserPrompt("");
    setLlmResponse(null);
    try {
      const responseData = await askMindfolder(
        userEmail,
        folderSelected,
        userPrompt
      );
      if (responseData) {
        setLlmResponse(responseData);
        setFinalUserPrompt(userPrompt);
      }
      console.log(responseData);
    } catch (err) {
      console.log("something went wrong", err);
    }
  };

  const handleUserPromptChange = (e) => {
    setUserPrompt(e.target.value);
  };

  const MAX_DISPLAY = 4;
  const extraCount = allFiles.length - MAX_DISPLAY;
  console.log(userPrompt);
  console.log(folderSelected);
  console.log(userEmail);
  return (
    <div className="relative h-svh">
      <div className="bg-gray-100 h-full flex flex-col overflow-hidden">
        {loading && <Loader />}
        {notification.message && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ message: "", type: "" })}
          />
        )}
        {!activeCategory && !askmee && !showCertificates && !showFreeSpace && (
          <>
            <header className="py-2 px-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-[22px] font-semibold text-gray-800">
                  Mindfolder
                </h1>
              </div>
            </header>

            <div className="relative w-full px-6 mt-4 flex-shrink-0">
              <div
                className="w-full bg-gray-300 rounded-full h-[14px] relative"
                style={{
                  boxShadow:
                    "0 2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              >
                <div
                  className="absolute bg-pink-500"
                  style={{
                    width: "4px",
                    height: "15px",
                    top: "-19px",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />

                <div
                  className="absolute bg-pink-500"
                  style={{
                    width: "2px",
                    height: "9px",
                    top: "-9px",
                    left: "25%",
                    transform: "translate(-75%, -50%)",
                  }}
                />

                <div
                  className="absolute bg-pink-500"
                  style={{
                    width: "2px",
                    height: "9px",
                    top: "-9px",
                    left: "75%",
                    transform: "translateY(-50%)",
                  }}
                />

                <div
                  className="bg-[#F275AA] h-[14px] rounded-full"
                  style={{
                    width: `${(totalStorageUsed / MAX_STORAGE) * 100}%`,
                    transition: "width 0.5s ease",
                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
                  }}
                />

                <div
                  className="absolute h-7 w-7 bg-[#C62B6D] border-white border-[8px] rounded-full top-[-5px] "
                  style={{
                    left: `calc(${
                      // (totalStorageUsed / MAX_STORAGE) * 100
                      storageUsed
                    }% - 10px)`,
                    transition: "left 0.5s ease",
                    boxShadow:
                    "-1.32px -1.32px 0.88px 0px #FFFFFFD9 , 0px -2px 2px 0px #00000066  ,"

              
                  }}
                  onClick={handleSliderClick}
                >
                  {isTooltipVisible && (
                    <div
                      className="absolute -top-6 w-[60px] h-[22px] transform -ml-6 bg-[#C62B6D] text-white text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        whiteSpace: "nowrap",
                        animation: "fade-in 0.3s forwards",
                      }}
                    >
                      {`${storageUsed} MB`}
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2 top-full"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "6px solid transparent",
                          borderRight: "6px solid transparent",
                          borderTop: "10px solid #C62B6D",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end text-sm">
                <span className="text-gray-600 font-medium mt-1">{`${MAX_STORAGE} MB`}</span>
              </div>
            </div>

            <div className="flex justify-center items-center w-full -mt-2 space-x-4">
              <div className="flex justify-center space-x-4 flex-shrink-0">
                <button
                  onClick={handleUpload}
                  className="flex flex-col items-center"
                >
                  <Image src={uploadd} alt="Upload" width={32} height={32} />
                  <span className="text-xs text-[#757575]">Upload</span>
                </button>
                {/* <button className="flex flex-col items-center">
                  <Image
                    src={freespacee}
                    alt="Free Space"
                    width={32}
                    height={32}
                  />
                  <span className="text-xs text-[#757575]">Free Space</span>
                </button> */}
                <div>
                  {/* Button */}
                  <button
                    className="flex flex-col items-center"
                    onClick={handleButtonClick}
                  >
                    <Image
                      src={freespacee}
                      alt="Free Space"
                      width={32}
                      height={32}
                    />
                    <span className="text-xs text-[#757575]">Free Space</span>
                  </button>

                  {/* Conditionally render FreeSpace component */}
                </div>
              </div>
            </div>
          </>
        )}
        {showFreeSpace && <FreeSpace onBack={() => setShowFreeSpace(false)} />}

        {!askmee ? (
          <div className="px-6 mt-4">
            {activeCategory !== null && (
              <div className="mb-4">
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setActiveCategory(null);
                      setSelectedFolderName("");
                    }}
                    className="text-sm text-[#1E1E1E] font-semibold text-[18px] flex items-center"
                  >
                    <Image
                      src={leftarrow}
                      alt="left"
                      width={42}
                      height={42}
                      className="mr-2"
                    />
                    <span>{selectedFolderName}</span>
                  </button>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </label>
                  <span className="text-sm text-gray-600 pl-2">
                    {selectedFiles.length} out of {files.length} files
                  </span>

                  {/* View and Grid buttons always visible */}
                  <div className="ml-auto flex shadow-inner bg-gray-200 rounded-md p-1/2">
                    {/* Button for View (List) */}
                    <button
                      onClick={() => toggleView("list")}
                      className={`flex items-center gap-2 rounded-md ${
                        !isGridView ? "bg-gray-200" : ""
                      }`}
                    >
                      <Image
                        src={isGridView ? "view1.svg" : "view.svg"}
                        alt="View"
                        width={30}
                        height={30}
                        className="h-8 w-8"
                      />
                    </button>

                    {/* Button for Grid */}
                    <button
                      onClick={() => toggleView("grid")}
                      className={`flex items-center gap-2 rounded-md ${
                        isGridView ? "bg-gray-200" : ""
                      }`}
                    >
                      <Image
                        src={isGridView ? "grid1.svg" : "grid.svg"}
                        alt="Grid"
                        width={30}
                        height={30}
                        className="h-8 w-8"
                      />
                    </button>
                  </div>

                  {/* Share button only visible when files are selected */}
                  {selectedFiles.length > 0 && (
                    // <div className="ml-4"
                    // onClick={handleShare}
                    // >
                    //   <Image
                    //     src={share}
                    //     alt="Share Icon"
                    //     className="h-12 w-12"
                    //   />
                    // </div>
                    <div className="ml-4" onClick={handleShare}>
                      <Image
                        src={share}
                        alt="Share Icon"
                        className="h-12 w-12"
                      />
                    </div>
                  )}
                  {!navigator.share && showSharePicker && (
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end"
                      onClick={closeSharePicker}
                    >
                      {/* Your existing custom share picker code */}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Display Files */}
            {activeCategory === null ? (
              !showFreeSpace &&
              (Object.keys(storedFolders).length === 0 ? (
                <div
                
                  className="px-2  border border-gray-300 rounded-xl shadow-xl -mt-2 py-32 font-normal text-center flex justify-center mb-16 items-center"
                  style={{
                    boxShadow: "0px 1px 10.8px 0px #00000040 inset",
                    background: "#00000008",
                    position: "relative",
                    gap: "8px",
                    borderRadius: "8px",
                    opacity: "1",
                    color: "#757575",
                  }}
                >
                 No files have been uploaded
                </div>
              ) : (
                <div
                  className="p-0  border border-gray-300 rounded-xl shadow-xl -mt-2 max-h-[332px] overflow-y-scroll"
                  style={{
                    boxShadow: "0px 1px 10.8px 0px #00000040 inset",
                    background: "#00000008",
                    position: "relative",
                    padding: "16px 0px 0px 0px",
                    gap: "8px",
                    borderRadius: "8px",
                    opacity: "1",
                  }}
                >
                  <div className="flex flex-wrap mx-4">
                    {Object.keys(storedFolders)?.map((folderName, index) => (
                      <div key={index} className="relative w-24 h-18 mx-1">
                        <div
                          onClick={() => handleFolderClick(folderName)}
                          className="cursor-pointer"
                        >
                          <Image
                            src={folderSelected === folderName ? green : red}
                            alt="item"
                            width={96}
                            height={72}
                            className="w-full h-full"
                          />
                          <div
                            className="absolute w-[76px] bottom-6 left-2 text-left font-semibold mb-1 text-[#757575] text-xs leading-tight"
                            style={{
                              padding: "2px 0px",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {folderName}
                          </div>
                          <span
                            className="absolute bottom-2 left-0 font-semibold text-[#757575] text-xs px-1 py-0.5 rounded"
                            style={{ transform: "translate(5px, -5px)" }}
                          >
                            {/* {item.number} */}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : !isGridView ? (
              <div
                className="p-2 mb-8 border border-gray-300 rounded-xl shadow-xl h-[420px] overflow-y-auto flex flex-col items-center"
                style={{
                  boxShadow: "0px 1px 10.8px 0px #00000040 inset",
                  background: "#00000008",
                  position: "relative",
                  gap: "8px",
                  borderRadius: "8px",
                  opacity: "1",
                }}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
              >
                {files.map((file, index) => {
                  const fileExtension = file.split(".").pop().toLowerCase();
                  let fileIcon;

                  if (fileExtension === "pdf") {
                    fileIcon = (
                      <Image src={pdf} alt="PDF" width={24} height={24} />
                    );
                  } else if (
                    fileExtension === "jpg" ||
                    fileExtension === "jpeg"
                  ) {
                    fileIcon = (
                      <Image src={jpg} alt="JPG" width={24} height={24} />
                    );
                  } else if (
                    fileExtension === "doc" ||
                    fileExtension === "docx"
                  ) {
                    fileIcon = (
                      <Image src={doc} alt="DOC" width={24} height={24} />
                    );
                  } else {
                    fileIcon = (
                      <Image
                        src={defaultIcon}
                        alt="File"
                        width={24}
                        height={24}
                      />
                    );
                  }
                  const dateTime = "21 December 2023, 14:45";
                  const isSelected = selectedFiles.includes(file);
                  const borderColor = isSelected
                    ? "border-pink-500"
                    : "border-pink-200";

                  return (
                    <div
                      key={index}
                      className={`flex items-center p-1 text-[#5A5A5A] ${borderColor} border-2 rounded shadow-sm`}
                      style={{
                        width: "100%",
                        gap: "6px",
                        borderRadius: "5px",
                        boxShadow: isSelected
                          ? "0px 4px 4px 0px #00000026"
                          : "1px 6px 8px 0px #827C7A80",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      {showCheckboxes && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFileSelect(file)}
                          className="form-checkbox h-4 w-4 text-pink-500 border-pink-500 focus:ring-pink-500 mr-0 mx-2"
                          style={{
                            accentColor: "#FF007F",
                          }}
                        />
                      )}
                      <div className="flex items-center space-x-2">
                        {fileIcon}
                        <div>
                          <div className="font-medium">{file}</div>
                          <div className="text-xs text-gray-500 mb-2">
                            {dateTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="grid grid-cols-2 p-2 -left-2 mb-8 border border-gray-300 rounded-xl shadow-xl h-[422px] overflow-y-auto"
                style={{
                  boxShadow: "0px 1px 10.8px 0px #00000040 inset",
                  background: "#00000008",
                  position: "relative",
                  gap: "8px",
                  borderRadius: "8px",
                  opacity: "1",
                }}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
              >
                {files.map((file, index) => {
                  const fileExtension = file.split(".").pop().toLowerCase();
                  let fileIcon;

                  if (fileExtension === "pdf") {
                    fileIcon = (
                      <Image src={pdf} alt="PDF" width={24} height={24} />
                    );
                  } else if (
                    fileExtension === "jpg" ||
                    fileExtension === "jpeg"
                  ) {
                    fileIcon = (
                      <Image src={jpg} alt="JPG" width={24} height={24} />
                    );
                  } else if (
                    fileExtension === "doc" ||
                    fileExtension === "docx"
                  ) {
                    fileIcon = (
                      <Image src={doc} alt="DOC" width={24} height={24} />
                    );
                  } else {
                    fileIcon = (
                      <Image
                        src={defaultIcon}
                        alt="File"
                        width={24}
                        height={24}
                      />
                    );
                  }

                  const dateTime = "21 December 2023, 14:45";
                  const isSelected = selectedFiles.includes(file);
                  const borderColor = isSelected
                    ? "border-pink-500"
                    : "border-pink-200";

                  return (
                    <div
                      key={index}
                      className={`flex flex-col items-center text-xs text-ellipsis text-[#5A5A5A] ${borderColor} border-2 p-2 rounded shadow-sm`}
                      style={{
                        gap: "6px",
                        borderRadius: "5px",
                        boxShadow: isSelected
                          ? "0px 4px 4px 0px #00000026"
                          : "1px 6px 8px 0px #827C7A80",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <div className="grid grid-cols-10 items-center space-x-1 h-[30px] justify-center">
                        {showCheckboxes && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleFileSelect(file)}
                            className="col-span-1 form-checkbox h-3 w-3 text-pink-500 border-pink-500 focus:ring-pink-500"
                            style={{
                              accentColor: "#FF007F",
                            }}
                          />
                        )}
                        <div className="col-span-2">{fileIcon}</div>
                        <div className="col-span-7 text-xs text-ellipsis text-wrap overflow-clip">
                          {file}
                        </div>
                        {/* <div className="text-xs text-gray-500 mb-2">{dateTime}</div> */}
                      </div>
                      <div className="">
                        <Image src={thumbnaill} alt="thumbnail" />
                      </div>
                    </div>
                  );
                })}
                <div></div>
              </div>
            )}
          </div>
        ) : showCertificates ? (
          <CertificatesView
            onBack={() => setShowCertificates(false)}
            allFiles={allFiles}
          />
        ) : (
          <div className="">
            <div className="flex items-center space-x-2 p-4 justify-between">
              <h1 className="text-[16px] font-semibold text-gray-800">
                Ask Me
              </h1>
              <h1>{folderSelected ? folderSelected : "ALL Folders"}</h1>
            </div>

            <div className="flex flex-col space-y-4">
              <Chat userPrompt={finalUserPrompt} llmResponse={llmResponse} />
            </div>
          </div>
        )}

        {activeCategory === null &&
          uploadedFiles.length > 0 &&
          !showCertificates &&
          !askmee &&
          !showFreeSpace && (
            <div className="px-3 py-2">
              <div
                className="flex gap-2 overflow-x-auto no-scrollbar rounded-md pb-2 "
                onClick={() => goToAskme()}
              >
                {[
                  "Files uploaded in the last 5 days",
                  "Train tickets booked for this week",
                  "What is my current state of my health?",
                ].map((question, index) => (
                  <button
                    key={index}
                    className="flex-shrink-0 border border-gray-300 text-center text-gray-500 rounded-lg py-2 px-3 text-xs"
                    style={{
                      width: "140px",
                      background:
                        "linear-gradient(180deg, #F4F4F4 0%, #FEFEFE 100%)",
                      boxShadow: "0px 4px 6px 0px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        {!showCertificates && !showFreeSpace && (
          <div className="px-4 py-2 flex-shrink-0 bottom-14 fixed w-full">
            <div className="flex items-center bg-[#F4F5F5] rounded-full border border-gray-300 shadow-[inset_0px_4px_3.3px_0px_rgba(0,0,0,0.12),0px_2px_2px_0px_#DAD5D5]">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-transparent text-sm focus:outline-none"
                value={userPrompt}
                onChange={handleUserPromptChange}
              />
              <button className="p-2" onClick={handleQuery}>
                <Image
                  src={arrowIcon}
                  alt="Send"
                  width={36}
                  height={36}
                  className="rounded-fulls"
                />
                <p></p>
              </button>
            </div>
          </div>
        )}
        {!showCertificates && (
          <div className="flex justify-around items-center py-2 bg-[rgba(0,0,0,0.03)] flex-shrink-0 bottom-0 fixed w-full shadow-[inset_0px_1px_4.8px_0px_rgba(0,0,0,0.25),0px_1px_1px_0px_#FFFFFF]">
            {[
              { label: "Home", icon: homee, onSelectIcon: pinkhomee },
              { label: "Ask me", icon: askme, onSelectIcon: pinkaskme },
              { label: "Profile", icon: profilee, onSelectIcon: pinkprofile },
            ].map((item) => (
              <button
                key={item.label}
                className={`flex flex-col items-center w-16 ${
                  activePage === item.label ? "text-pink-600" : "text-gray-600"
                }`}
                onClick={() => handleNavigation(item.label)}
              >
                <Image
                  src={
                    activePage === item.label ? item.onSelectIcon : item.icon
                  }
                  alt={item.label}
                  width={20}
                  height={20}
                  className={activePage === item.label ? "text-pink-600" : ""}
                />
                <span className="text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>
        )}

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
                <div>
                  <h3 className="text-lg font-normal text-[#5A5A5A] ">
                    {selectedFiles.length} file
                    {selectedFiles.length > 1 ? "s" : ""} selected
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
                    <a
                      href="https://messages.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={messages}
                        alt="Messages"
                        width={54}
                        height={54}
                      />
                      <span className="text-xs mt-1 text-[#757575] font-semibold">
                        Messages
                      </span>
                    </a>
                  </div>
                  <div className="flex flex-col items-center">
                    <a
                      href="https://mail.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image src={gmail} alt="Gmail" width={54} height={54} />
                      <span className="text-xs mt-1 text-[#757575] font-semibold">
                        Gmail
                      </span>
                    </a>
                  </div>
                  <div className="flex flex-col items-center">
                    <a
                      href="https://www.whatsapp.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={whatsapp}
                        alt="WhatsApp"
                        width={54}
                        height={54}
                      />
                      <span className="text-xs mt-1 text-[#757575] font-semibold">
                        WhatsApp
                      </span>
                    </a>
                  </div>
                  <div className="flex flex-col items-center">
                    <a
                      href="https://telegram.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={telegram}
                        alt="Telegram"
                        width={54}
                        height={54}
                      />
                      <span className="text-xs mt-1 text-[#757575] font-semibold">
                        Telegram
                      </span>
                    </a>
                  </div>
                  <div className="flex flex-col items-center">
                    <a
                      href="https://drive.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image src={drive} alt="Drive" width={54} height={54} />
                      <span className="text-xs mt-1 text-[#757575] font-semibold">
                        Drive
                      </span>
                    </a>
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
    </div>
  );
};

export default FirstPage;
