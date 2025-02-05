"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import "../styles/global.css";
import { useRouter } from "next/navigation";
import mindfolderIcon from "../assets/signup.png";
import { verifyEmail, verifyOtp, resendOtp } from "../services/api";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import Cookies from "js-cookie";
import leftarrow from "../assets/left-arrows.svg";

const FirstPage = ({onBack}) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(5).fill(""));
  const [step, setStep] = useState("initial");
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [isResendEnabled, setIsResendEnabled] = useState();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const router = useRouter();
  const [documentId, setDocumentId] = useState("");
  const [username, setUsername] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const handleBack = () => {
    setStep("initial");
    setCode(Array(5).fill(""));
    setOtpError("");
    if (onBack) {
      onBack();
    }
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email cannot be blank";
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) return "Invalid Email";
    return "";
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value.replace(/\s/g, '');
    setEmail(newEmail);
    setError("");
  };

  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEmailSubmit();
    }
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.key === 'Enter' && !code.some(digit => digit.trim() === "")) {
      handleSignIn();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('overlay')) {
      handleCloseError();
    }
  };

  const handleCloseError = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOtpError("");
      setIsClosing(false);
    }, 300);
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const updatedCode = [...code];
      
      if (!code[index] && index > 0) {
        updatedCode[index - 1] = '';
        setCode(updatedCode);
        document.getElementById(`otp-input-${index - 1}`).focus();
      } else {
        updatedCode[index] = '';
        setCode(updatedCode);
      }
    }
  };

  const handleEmailSubmit = async () => {
    setError("");
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const response = await verifyEmail(email);
      console.log(response);
      if (response?.otp_document_id) {
        setStep("verification");
        setDocumentId(response?.otp_document_id);
        setUsername(response?.name)
        setNotification({ message: "OTP sent successfully!", type: "success" });
      } else if (response?.message == "User not found, please sign up") {
        setNotification({ message: response?.message, type: "error" });
      } else {
        setNotification({
          message: "Could not able to send otp. Server error",
          type: "error",
        });
      }
    } catch (err) {
      setNotification({
        message: "Failed to send OTP. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setCountdown(10);
      setIsResendEnabled(false);
      setTimeout(() => {
        setNotification({ message: "", type: "" }); 
      }, 5000);
    }
  };

  const handleOtpInputChange = (e, index) => {
    const value = e.target.value;
    if (/^\d$/.test(value) || value === "") {
      const updatedCode = [...code];
      updatedCode[index] = value;
      setCode(updatedCode);

      if (value && index < 4) {
        document.getElementById(`otp-input-${index + 1}`).focus();
      }
    }
  };

  const handleSignIn = async () => {
    setOtpError("");
    if (code.some((digit) => digit.trim() === "")) {
      setOtpError("OTP cannot be blank");
      return;
    }
    setLoading(true);
    try {
      const enteredOtp = code.join("");
      const response = await verifyOtp(email, enteredOtp, documentId);
      console.log(response);
      if (response?.message != "Failed to verify OTP") {
        setNotification({
          message: "Successfully signed in!",
          type: "success",
        });
        Cookies.set("session_id", documentId, {
          expires: 1 / 3,
        });
        Cookies.set("email", email, { expires: 1 / 3 });
        router.push("/mindfolderpage");
      } else {
        setOtpError("Incorrect OTP");
        setNotification({ message: "Invalid OTP. Try again.", type: "error" });
      }
    } catch (err) {
      setNotification({
        message: "OTP verification failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendEnabled(true);
    }
  }, [countdown]);

  const handleResendOtp = async () => {
    setCountdown(10);
    setIsResendEnabled(false);
    try {
      const response = await resendOtp(documentId,email,username);
      console.log(response)
      if(response?.otp_document_id){
        setDocumentId(response?.otp_document_id);
        Cookies.set("session_id", response?.otp_document_id, {
          expires: 1 / 3,
        });
        setNotification({ message: "OTP has been resent!", type: "success" });
      }else{
        setNotification({ message: "Failed to resend OTP.", type: "error" });
      }
    } catch (err) {
      console.log("failed resending otp.", err);
    }
  };
  
  console.log()
  return (
    <div className="flex flex-col items-center justify-center h-svh gap-10">
      {loading && <Loader />}
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
      )}

      {step === "initial" && (
        <div className="flex -mt-16">
          <Image src={mindfolderIcon} alt="mindfolder-icon" className="" />
        </div>
      )}

      <div className="flex items-center px-4 justify-center w-full">
        <div className="w-full max-w-md">
          {step === "initial" && (
            <>
              <div className="text-[#5A5A5A] text-center mb-4 font-bold">
                Sign in
              </div>

              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                onKeyPress={handleEmailKeyPress}
                className="w-full h-[3.5rem] rounded-md p-2 border text-sm font-normal focus:outline-none mb-4"
                style={{
                  background: "rgba(200, 200, 200, 0.3)",
                  borderImageSource: "linear-gradient(128.08deg, rgba(112, 112, 112, 0.3) 1.39%, #FFFFFF 61.14%)",
                  boxShadow: "0px 1px 5.3px 0px #00000096 inset, 0px 1px 1px 0px #FFFFFF",
                  fontWeight: "bold",
                }}
              />

              {error && (
                <p className="text-red-500 text-sm text-center mb-4">{error}</p>
              )}

              <button
                onClick={handleEmailSubmit}
                disabled={!email.trim() || loading}
                className={`w-full py-2 mb-4 text-white font-semibold rounded-md transition ${
                  !email.trim() || loading
                    ? "bg-[#334998]/40 cursor-not-allowed" 
                    : "bg-[#334998]"
                }`}
                style={{
                  boxShadow: "0px 1.91px 3.75px 0px #FFFFFF87 inset, 0px 5.73px 9.55px 0px #00000066",
                }}
              >
                {loading ? "Sending OTP..." : "Get OTP"}
              </button>
            </>
          )}

          {step === "verification" && (
            <>
              <div className={` w-full flex items-center fixed top-0 left-0 p-4 ${otpError ? 'blur-[1px]' : ''}`}>
                <button className="p-2" onClick={handleBack}>
                  <Image 
                    src={leftarrow} 
                    width={42} 
                    height={42} 
                    className="mr-2" 
                    alt="leftarrow" 
                    onClick={onBack} 
                  />
                </button>
              </div>

              <div className="text-center">
                <p className="text-[#5A5A5A] font-bold text-xl">
                  Enter Verification Code
                </p>
                <p className="text-[#767676] text-sm">
                  We've sent a five-digit code to
                </p>
                <p className="text-black font-semibold text-sm">{email}</p>

                <div className="flex justify-center space-x-2 mt-4">
                  {Array(5)
                    .fill("")
                    .map((_, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength="1"
                        value={code[index] || ""}
                        onChange={(e) => handleOtpInputChange(e, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                        className={`w-full h-[65px] text-center border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          otpError ? "border-red-500 bg-red-100" : "bg-[#C8C8C84D]"
                        }`}
                        style={{
                          borderRadius: "8px",
                          borderWidth: otpError ? "1px" : "1px",
                          boxShadow: otpError
                            ? "0px 1px 3px 0px #00000096 inset, 0px 1px 1px 0px #FFFFFF"
                            : "0px 1px 5.3px 0px #00000096 inset, 0px 1px 1px 0px #FFFFFF",
                          fontSize: "31px",
                          fontWeight: "bold",
                          color: "#1E1E1E",
                        }}
                      />
                    ))}
                </div>

                {otpError && (
                  <>
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[0px] z-40 overlay"
                      onClick={handleOverlayClick}
                    ></div>
                    <div
                      className={`fixed bottom-0 left-0 w-full bg-[#ECECEC] shadow-lg p-3 border border-gray-300 rounded-xl z-50 transition-transform duration-300 ease-in-out transform ${
                        isClosing ? 'translate-y-full' : '-translate-y-0'
                      } ${!isClosing ? 'animate-slide-up' : 'animate-slide-down'}`}
                      style={{
                        transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
                        transition: 'transform 300ms ease-in-out',
                      }}
                    >
                      <p className="text-[#C00F0C] font-medium text-lg">Incorrect OTP</p>
                      <p className="text-[#767676] text-sm mt-2">
                        The OTP you entered is incorrect. Please click on 'Resend OTP' to receive a new one.
                      </p>
                      <button
                        onClick={handleResendOtp}
                        className="w-full py-2 mt-4 text-[#FCFCFC] font-bold bg-[#334998] rounded-md"
                        style={{
                          boxShadow: "0px 1.91px 3.75px 0px #FFFFFF87 inset, 0px 5.73px 9.55px 0px #00000066",
                        }}
                      >
                        Resend OTP
                      </button>
                      <button
                        onClick={handleCloseError}
                        className="w-full py-2 mt-2 text-[#757575] font-bold hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                <button
                  onClick={handleSignIn}
                  disabled={code.some((value) => !value.trim()) || loading}
                  className={`w-full py-2 mt-4 font-semibold rounded-md transition ${
                    code.some((value) => !value.trim())
                      ? "bg-[#334998]/60 text-white cursor-not-allowed"
                      : "bg-[#334998] text-white"
                  }`}
                  style={{
                    boxShadow: "0px 1.91px 3.75px 0px #FFFFFF87 inset, 0px 5.73px 9.55px 0px #00000066",
                  }}
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>

                <div className="mt-4 text-sm text-gray-500">
                  {isResendEnabled ? (
                    <button
                      onClick={handleResendOtp}
                      className="text-[#334998] font-semibold "
                    >
                      <span className="text-[#767676] font-normal active:underline">Didn't get a code?</span> Click to resend
                    </button>
                  ) : (
                    <span>Resend OTP in {countdown} seconds</span>
                  )}
                </div>
            </div>
            </>
          )}
          {step == "initial" && (
            <p
              className="text-center text-[#5A5A5A] font-medium cursor-pointer"
              onClick={() => router.push("/signup")}
            >
              Dont have an account? <span className="font-bold text-blue-600 active:underline">Sign up</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirstPage;
