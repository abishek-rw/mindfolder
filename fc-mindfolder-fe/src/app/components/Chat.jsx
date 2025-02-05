"use client";
import React, { useState, useEffect } from "react";

const Chat = ({ userPrompt, llmResponse }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userPrompt) {
      // Prevent duplicate user messages
      const userMessage = {
        text: userPrompt,
        sender: "user",
        id: Date.now() + Math.random(), // Ensure uniqueness for each message
      };

      // Only add if the last message is not the same
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.text === userMessage.text) {
          return prev; // Don't add if the message is the same
        }
        return [...prev, userMessage];
      });
      setIsLoading(true);

      // Set up a timeout that will trigger if no response is received within 5 minutes
      const timeoutId = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: "No response from AI.", sender: "ai", id: Date.now() + Math.random() },
        ]);
        setIsLoading(false);
      }, 300000); // 5 minutes timeout

      const handleResponse = () => {
        let aiResponse;

        if (llmResponse && Array.isArray(llmResponse.response)) {
          aiResponse =
            llmResponse.response.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400 text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 px-2 py-1">Folder</th>
                      <th className="border border-gray-400 px-2 py-1">File Name</th>
                      <th className="border border-gray-400 px-2 py-1">Type</th>
                      <th className="border border-gray-400 px-2 py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {llmResponse.response.map((file, index) => (
                      <tr key={index} className="border border-gray-400">
                        <td className="border px-2 py-1">{file.folder_name || "N/A"}</td>
                        <td className="border px-2 py-1">{file.file_name}</td>
                        <td className="border px-2 py-1">{file.file_type}</td>
                        <td className="border px-2 py-1">{file.file_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              "No files found."
            );
        } else if (llmResponse && typeof llmResponse.response.response === "string") {
          aiResponse = llmResponse.response.response;
        } else if (llmResponse && typeof llmResponse.response === "string") {
          aiResponse = llmResponse.response;
        } else {
          aiResponse = "No response from AI.";
        }

        // Clear the timeout since the response has arrived
        clearTimeout(timeoutId);

        // Update messages with the AI response
        setMessages((prev) => [
          ...prev,
          { text: aiResponse, sender: "ai", id: Date.now() + Math.random() },
        ]);
        setIsLoading(false);
      };

      // If llmResponse is already available, handle it right away
      if (llmResponse) {
        handleResponse();
      }

      // Cleanup on component unmount or when userPrompt or llmResponse change
      return () => clearTimeout(timeoutId);
    }
  }, [userPrompt, llmResponse]);

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-md mx-auto bg-gray-100 p-3 sm:p-4">
      <div className="flex-1 overflow-y-auto mb-3 space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg p-2 text-sm max-w-[80%] ${
                message.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"
              } animate-fade-in`}
            >
              {typeof message.text === "object" ? (
                message.text
              ) : (
                <div>{message.text}</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg p-2 text-sm max-w-[80%] bg-gray-300 text-gray-700 animate-fade-in">
              <div className="flex items-center">
                <span>Generating response...</span>
                <div className="ml-2 h-4 w-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
