export const useDify = () => {
  const config = useRuntimeConfig();
  const API_KEY = config.public.DIFY_API_KEY;
  const API_URL = config.public.DIFY_API_URL;
  const USER_ID = config.public.DIFY_USER_ID;

  const uploadImage = async (file) => {
    let formData = new FormData();
    formData.append("file", file);
    formData.append("user", USER_ID);
    console.log(file);

    try {
      const response = await fetch(`${API_URL}/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return {
        url: `${API_URL}/files/${data.id}`,
        ...data,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const sendMessage = async (
    message,
    conversationId = null,
    imageUrl = null
  ) => {
    const payload = {
      inputs: {},
      query: imageUrl ? `${message}\n![Image](${imageUrl})` : message,
      conversation_id: conversationId,
      response_mode: "streaming",
      user: USER_ID,
    };

    try {
      const response = await fetch(`${API_URL}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return response.body;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const fetchMessageHistory = async (conversationId) => {
    try {
      const response = await fetch(
        `${API_URL}/messages?conversation_id=${conversationId}&user=${USER_ID}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch message history");
      }

      const data = await response.json();

      // Transform the messages to create separate user and assistant messages
      const messages = [];
      (data.data || []).forEach((msg) => {
        // Add user message
        messages.push({
          id: `${msg.id}-user`,
          content: msg.query,
          role: "user",
          created_at: msg.created_at,
        });

        // Add assistant message
        messages.push({
          id: `${msg.id}-assistant`,
          content: msg.answer,
          role: "assistant",
          created_at: msg.created_at + 1, // Add 1 to ensure correct ordering
        });
      });

      return messages.sort((a, b) => a.created_at - b.created_at);
    } catch (error) {
      console.error("Error fetching message history:", error);
      throw error;
    }
  };

  const fetchApplicationInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/parameters`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch application info");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching application info:", error);
      throw error;
    }
  };

  const fetchSuggestedQuestions = async (messageid) => {
    try {
      return [];
      // Get from local storage
      const appInfo = JSON.parse(localStorage.getItem("appInfo"));

      // console.log(appInfo);
      if (!appInfo) {
        throw new Error("App info not found");
      }

      if (!appInfo.suggested_questions_after_answer.enabled) {
        return [];
      }

      const response = await fetch(
        `${API_URL}/messages/${messageid}/suggested?user=${USER_ID}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggested questions");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching suggested questions:", error);
      throw error;
    }
  };

  const stopMessageGeneration = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/chat-messages/${taskId}/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: USER_ID,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to stop generation");
      }

      const data = await response.json();
      return data.result === "success";
    } catch (error) {
      console.error("Error stopping generation:", error);
      throw error;
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: USER_ID,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  };

  return {
    sendMessage,
    fetchMessageHistory,
    uploadImage,
    fetchApplicationInfo,
    fetchSuggestedQuestions,
    stopMessageGeneration,
    deleteConversation,
  };
};
