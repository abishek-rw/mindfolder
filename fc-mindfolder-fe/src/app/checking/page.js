"use client";
import { useState } from "react";


const UploadFileComponent = () => {
  const [filePath, setFilePath] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!filePath || !userEmail) {
      setResponseMessage("Error: Please fill in all fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file_path", filePath);
      formData.append("user_email", userEmail);

      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setResponseMessage(`Success: ${JSON.stringify(result)}`);
      } else {
        setResponseMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setResponseMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleUpload}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h1 className="text-xl font-semibold mb-4">Upload File</h1>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">File Path</label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Enter file path"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">User Email</label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Upload
        </button>
      </form>
      {responseMessage && (
        <div className={`mt-4 p-4 rounded-md ${
          responseMessage.startsWith('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p>{responseMessage}</p>
        </div>
      )}
    </div>
  );
};

export default UploadFileComponent;