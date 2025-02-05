const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


export const verifyEmail = async (email) =>{
    try{
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) throw new Error("Failed to verify email.");
        return await response.json();
    }catch(error){
        console.error("Error verifying email.", error);
        return null;
    }
}
export const resendOtp = async (documentId,email,name) =>{
    try{
        const response = await fetch(`${apiBaseUrl}/resend-otp?document_id=${documentId}&email=${email}&name=${name}`, {
            method: "POST",
        });
        if (!response.ok) throw new Error("Failed to verify email.");
        return await response.json();
    }catch(error){
        console.error("Error resending otp.", error);
        return null;
    }
}


export const verifyOtp = async (email,enteredOtp,documentId) =>{
    console.log(enteredOtp)
    console.log(documentId)
    try{
        const response = await fetch(`${apiBaseUrl}/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email:email,otp: enteredOtp,document_id: documentId }),
        });
        if (!response.ok) throw new Error("Failed to verify email.");
        return await response.json();
    }catch(error){
        console.error("Error verifying email.", error);
        return null;
    }
}
export const signUp = async (username, email) => {
    try {
        const response = await fetch(`${apiBaseUrl}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name:username, email:email }),
        });

        if (!response.ok) {
            throw new Error("Failed to sign up.");
        }

        return await response.json();
    } catch (error) {
        console.error("Error signing up:", error);
        return null;
    }
};

export const uploadFiles = async (files, email) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", email);
  
      try {
        const response = await fetch(`${apiBaseUrl}/upload`, {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        return await response.json();
        
      } catch (error) {
        console.error("Upload error:", error.message);
        return null;
      }
    }
  
  };

export const fetchFolders = async (email) => {
    if (!email) {
        console.error("Please provide a valid email address.");
        return null;
      }
    try {
        const response = await fetch(`${apiBaseUrl}/list-files?user_email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error("Failed to fetch folders.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching folders:", error);
        return null;
    }
};

export const fetchFolderSize = async (email) => {
    if (!email) {
      console.error("Please provide a valid email address.");
      return null;
    }
  
    try {
      const response = await fetch(
        `${apiBaseUrl}/folder_size?user_email=${encodeURIComponent(email)}`
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData.error || "An error occurred.");
        return null;
      }
  
      const data = await response.json();
      return data.files; // Return the fetched data
    } catch (error) {
      console.error("Network error:", error);
      return null;
    }
  };

export const askMindfolder = async (email,folderName,userPrompt) => {
  console.log(email,folderName,userPrompt)
    try {
        const response = await fetch(`${apiBaseUrl}/process-query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_email:email,user_prompt:userPrompt,folder_name:folderName}),
        });

        console.log(response)

        if (!response.ok) {
            throw new Error("Failed to fetch response.");
        }

        return await response.json();
    } catch (error) {
        console.error("Something went wrong:", error);
        return null;
    }

  };
  
  