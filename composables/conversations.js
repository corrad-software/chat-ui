export const useConversations = () => {
  const conversations = ref([]);
  const isLoading = ref(false);
  const listKey = ref(0);

  const fetchConversations = async () => {
    const config = useRuntimeConfig();
    const API_KEY = config.public.DIFY_API_KEY;
    const API_URL = config.public.DIFY_API_URL;
    const USER_ID = config.public.DIFY_USER_ID;

    try {
      isLoading.value = true;
      const response = await fetch(`${API_URL}/conversations?user=${USER_ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      conversations.value = data.data || [];
      listKey.value++;
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    conversations,
    isLoading,
    fetchConversations,
    listKey,
  };
};
