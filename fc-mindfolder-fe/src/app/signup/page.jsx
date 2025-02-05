

"use client";

import "../styles/global.css";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "../services/api";
import Image from "next/image";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import mindfolderIcon from "../assets/signup.png";

const SignUpPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const router = useRouter();

  const validateEmail = (email) => {
    if (!email.trim()) return "Email cannot be blank";
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) return "Invalid Email";
    return "";
  };

  const validateName = (name) => {
    if (!name.trim()) return "Name cannot be blank";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
    return "";
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value.replace(/\s/g, '');
    setEmail(newEmail);
    setError("");
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setUsername(newName);
    setNameError("");
  };

  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ message: "", type: "" });
    setError("");
    setNameError("");

    const emailError = validateEmail(email);
    const nameError = validateName(username);

    if (emailError || nameError) {
      setError(emailError);
      setNameError(nameError);
      setLoading(false);
      return;
    }

    try {
      const response = await signUp(username, email);
      setNotification({ message: "Sign up successful! Redirecting...", type: "success" });
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      console.error("Error signing up:", err);
      setNotification({ message: "Error signing up. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

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

      <div className="flex -mt-16">
        <Image src={mindfolderIcon} alt="mindfolder-icon" className="" />
      </div>

      <div className="flex items-center px-4 justify-center w-full">
        <div className="w-full max-w-md">
          <div className="text-[#5A5A5A] text-center mb-4 font-bold">
            Sign Up
          </div>

          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              id="Name" 
              name="username" 
              placeholder="Enter your name"
              value={username}
              onChange={handleNameChange}
              onKeyPress={handleNameKeyPress}
              className="w-full h-[3.5rem] rounded-md p-2 border text-sm font-normal focus:outline-none mb-4"
              style={{
                background: "rgba(200, 200, 200, 0.3)",
                borderImageSource: "linear-gradient(128.08deg, rgba(112, 112, 112, 0.3) 1.39%, #FFFFFF 61.14%)",
                boxShadow: "0px 1px 5.3px 0px #00000096 inset, 0px 1px 1px 0px #FFFFFF",
                fontWeight: "bold",
              }}
            />
            {nameError && (
              <p className="text-red-500 text-sm text-center mb-4">{nameError}</p>
            )}

            <input 
              type="email" 
              id="email" 
              name="email" 
              value={email}
              placeholder="Enter Your email address"
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
              type="submit" 
              disabled={!email.trim() || !username.trim() || loading}
              className={`w-full py-2 mb-4 text-white font-semibold rounded-md transition ${
                !email.trim() || !username.trim() || loading
                  ? "bg-[#334998]/40 cursor-not-allowed"
                  : "bg-[#334998]"
              }`}
              style={{
                boxShadow: "0px 1.91px 3.75px 0px #FFFFFF87 inset, 0px 5.73px 9.55px 0px #00000066",
              }}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-[#5A5A5A] font-medium cursor-pointer" onClick={() => router.push('/')}>
            Already have an account? <span className="font-bold text-blue-600 active:underline">Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;