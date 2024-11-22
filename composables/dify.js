export const useDify = () => {
  const config = useRuntimeConfig();
  const API_KEY = config.public.DIFY_API_KEY;
  const API_URL = config.public.DIFY_API_URL;
  const USER_ID = config.public.DIFY_USER_ID;

  const sendMessage = async (message, conversationId = null) => {
    try {
      const response = await fetch(`${API_URL}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          inputs: {},
          query: message,
          user: USER_ID,
          response_mode: "streaming",
        }),
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

  return {
    sendMessage,
    fetchMessageHistory,
  };
};
