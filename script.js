import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize GoogleGenerativeAI with your API Key
const gemini = new GoogleGenerativeAI({
  apiKey: "AIzaSyBieK_gRcSd8vAl5tAZYcwCL0qNBsdNqmk",
});

// Get elements
const chatWidget = document.getElementById("chat-widget");
const closeChat = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-btn");
const stopBtn = document.getElementById("stop-btn");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const chatToggle = document.getElementById("chat-toggle");
const openChat = document.getElementById("open-chat");
const imageUpload = document.getElementById("image-upload");
const uploadBtn = document.getElementById("upload-btn");

// Initial state
let chatOpen = false;
let shouldScroll = true;
let abortController = new AbortController();

// Toggle chat visibility
function toggleChat() {
  chatOpen = !chatOpen;
  chatWidget.style.display = chatOpen ? "flex" : "none";
  chatToggle.style.display = chatOpen ? "none" : "block";
}

// Close chat widget
closeChat.addEventListener("click", toggleChat);

// Open chat widget
openChat.addEventListener("click", toggleChat);

// Check if the user is at the bottom of the chat messages
function isScrolledToBottom() {
  return (
    chatMessages.scrollHeight - chatMessages.clientHeight <=
    chatMessages.scrollTop + 1
  );
}

// Send message
async function sendMessage() {
  const message = chatInput.value.trim();
  if (message !== "") {
    // Prepare pre-prompt with variable data
    const soilType = document.getElementById("soilType").value || "N/A";
    const climateType = document.getElementById("climateType").value || "N/A";
    const plantName = document.getElementById("plantName").value || "N/A";
    const landArea = document.getElementById("landArea").value || "N/A";
    const prePrompt = `
        Soil Type: ${soilType}
        Climate Type: ${climateType}
        Plant Name: ${plantName}
        Land Area: ${landArea} m²
    `;

    // Combine pre-prompt with user's message
    const finalPrompt = `${prePrompt}\n\n Give a very short response. User's Message: ${message}`;

    // Display user message
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user");
    userMessage.textContent = message;
    chatMessages.appendChild(userMessage);
    chatInput.value = "";

    // Display placeholder for bot's response
    const responseElement = document.createElement("div");
    responseElement.classList.add("message", "bot");
    responseElement.textContent = "..."; // Placeholder
    chatMessages.appendChild(responseElement);

    // Scroll to the bottom if the user is at the bottom
    if (isScrolledToBottom()) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Ensure the abort controller is set only once
    abortController = new AbortController();

    // Call Gemini API with the pre-prompt and user's message
    await generateResponse(finalPrompt, responseElement, abortController.signal);
  }
}

// Send message when Enter key is pressed
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// Send message when button is clicked
sendBtn.addEventListener("click", sendMessage);

// Stop text generation when Stop button is clicked
stopBtn.addEventListener("click", () => {
  abortController.abort();
});

// Generate response using Google Generative AI
async function generateResponse(prompt, responseElement, signal) {
  try {
    const genAI = new GoogleGenerativeAI(
      "AIzaSyBieK_gRcSd8vAl5tAZYcwCL0qNBsdNqmk"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt], { signal });
    const textResponse =
      result.response?.candidates[0]?.content?.parts[0]?.text || "No response.";
    responseElement.textContent = textResponse;

    // Scroll to the bottom if the user is at the bottom
    if (shouldScroll && isScrolledToBottom()) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } catch (error) {
    console.error("Error:", error);
    if (error.name === "AbortError") {
      responseElement.textContent = "Generation stopped.";
    } else {
      responseElement.textContent = `Request failed: ${error.message}`;
    }
  }
}

// Helper function to convert File to GenerativePart
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Open the file selector when the upload button is clicked
uploadBtn.addEventListener("click", () => {
  imageUpload.click();
});

// Handle file selection
imageUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('Please select a valid image file (JPEG, PNG, or WebP)');
    return;
  }
  
  // Validate file size (max 4MB)
  if (file.size > 4 * 1024 * 1024) {
    alert('Please select an image smaller than 4MB');
    return;
  }

  // Display the image in the chat
  const userMessage = document.createElement("div");
  userMessage.classList.add("message", "user");
  const imgElement = document.createElement("img");
  imgElement.src = URL.createObjectURL(file);
  imgElement.alt = "User uploaded image";
  imgElement.style.maxWidth = "100%";
  imgElement.style.borderRadius = "10px";
  userMessage.appendChild(imgElement);
  chatMessages.appendChild(userMessage);

  // Placeholder for bot's response
  const responseElement = document.createElement("div");
  responseElement.classList.add("message", "bot");
  responseElement.textContent = "Processing image...";
  chatMessages.appendChild(responseElement);

  // Scroll to the bottom if necessary
  if (isScrolledToBottom()) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  try {
    // Get current form data for context
    const soilType = document.getElementById("soilType").value || "N/A";
    const climateType = document.getElementById("climateType").value || "N/A";
    const plantName = document.getElementById("plantName").value || "N/A";
    const landArea = document.getElementById("landArea").value || "N/A";
    const message = chatInput.value.trim();
    chatInput.value = '';
    const prePrompt = `
      Soil Type: ${soilType}
      Climate Type: ${climateType}
      Plant Name: ${plantName}
      Land Area: ${landArea} m²
      
      Please analyze this image in the context of the above information. Give a very short response. User's Message: ${message}
    `;

    const genAI = new GoogleGenerativeAI("AIzaSyBieK_gRcSd8vAl5tAZYcwCL0qNBsdNqmk");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imagePart = await fileToGenerativePart(file);
    const result = await model.generateContent([prePrompt, imagePart]);
    const response = result.response;
    
    responseElement.textContent = response?.candidates[0]?.content?.parts[0]?.text || "No response.";
    // Clean up
    URL.revokeObjectURL(imgElement.src);
    imageUpload.value = ''; // Reset file input after successful upload
  } catch (error) {
    console.error("Error processing image:", error);
    let errorMessage = "Failed to process the image.";
    
    if (error.message?.includes("INVALID_ARGUMENT")) {
      errorMessage = "Invalid image format or size. Please try a different image.";
    } else if (error.message?.includes("PERMISSION_DENIED")) {
      errorMessage = "API key error. Please check your configuration.";
    } else if (error.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMessage = "API quota exceeded. Please try again later.";
    }
    
    responseElement.textContent = errorMessage;
  }

  // Clean up the object URL
  URL.revokeObjectURL(imgElement.src);
});