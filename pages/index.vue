<script setup>
import { Plus, MessageSquare, Send, Menu } from "lucide-vue-next";

const messages = ref([]);
const inputMessage = ref("");
const isOpen = ref(false);
const isLoading = ref(false);
const conversationId = ref(null);
const chatContainer = ref(null);
const shouldAutoScroll = ref(true);
const { isAtBottom } = useScroll();

const { sendMessage, fetchMessageHistory } = useDify();
const {
  conversations,
  isLoading: isLoadingConversations,
  fetchConversations,
} = useConversations();
const selectedConversationId = ref(null);

onMounted(() => {
  fetchConversations();
});

watch(
  () => messages.value,
  () => {
    if (shouldAutoScroll.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  },
  { deep: true }
);

const scrollToBottom = () => {
  if (!chatContainer.value) return;
  chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
};

const handleScroll = () => {
  if (!chatContainer.value) return;
  shouldAutoScroll.value = isAtBottom(chatContainer.value);
};

const handleSendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  shouldAutoScroll.value = true;

  const userMessage = inputMessage.value;
  inputMessage.value = "";
  isLoading.value = true;

  // Add user message
  messages.value.push({
    id: Date.now(),
    content: userMessage,
    role: "user",
  });

  // Scroll to bottom after adding user message
  nextTick(() => {
    scrollToBottom();
  });

  try {
    // Send message to Dify
    const response = await sendMessage(userMessage, conversationId.value);
    const reader = response.getReader();
    let assistantMessage = "";

    // Add initial AI message
    const assistantMessageId = Date.now();
    messages.value.push({
      id: assistantMessageId,
      content: "",
      role: "assistant",
    });

    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode and parse the chunk
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim() === "") continue;
        if (line.includes("data: ")) {
          const jsonStr = line.replace("data: ", "");
          try {
            const data = JSON.parse(jsonStr);
            if (data.event === "message") {
              if (!conversationId.value) {
                conversationId.value = data.conversation_id;
                fetchConversations();
              }

              assistantMessage += data.answer;
              // Update the last message content
              const lastMessage = messages.value[messages.value.length - 1];
              if (lastMessage && lastMessage.id === assistantMessageId) {
                lastMessage.content = assistantMessage;
                // Only scroll if user hasn't scrolled up
                if (shouldAutoScroll.value) {
                  nextTick(() => {
                    scrollToBottom();
                  });
                }
              }
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    messages.value.push({
      id: Date.now(),
      content: "Sorry, there was an error processing your message.",
      role: "assistant",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleConversationSelect = async (id) => {
  try {
    selectedConversationId.value = id;
    conversationId.value = id;
    isOpen.value = false; // Close mobile menu after selection

    // Clear current messages and show loading state
    messages.value = [];
    isLoading.value = true;

    // Fetch message history
    const history = await fetchMessageHistory(id);

    // Set messages directly since they're already transformed
    messages.value = history;

    // Reset auto-scroll when loading a new conversation
    shouldAutoScroll.value = true;

    // Scroll to bottom after loading messages
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error("Error loading conversation:", error);
    // You might want to show an error toast here
  } finally {
    isLoading.value = false;
  }
};

const handleNewChat = () => {
  selectedConversationId.value = null;
  conversationId.value = null;
  messages.value = [];
};
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Desktop Sidebar -->
    <div class="w-64 border-r border-border p-4 hidden md:block">
      <div class="flex items-center justify-between mb-4">
        <Button class="flex-1 mr-2" variant="outline" @click="handleNewChat">
          <Plus class="mr-2" />
          New Chat
        </Button>
        <ThemeToggle />
      </div>
      <div class="space-y-2">
        <div v-if="isLoadingConversations" class="text-center py-4">
          <span class="text-sm text-muted-foreground">Loading...</span>
        </div>
        <Button
          v-else
          v-for="conversation in conversations"
          :key="conversation.id"
          variant="ghost"
          class="w-full justify-start"
          :class="{ 'bg-accent': selectedConversationId === conversation.id }"
          @click="handleConversationSelect(conversation.id)"
        >
          <MessageSquare class="mr-2" />
          {{ conversation.name || "Conversation " + conversation.id.slice(-4) }}
        </Button>
      </div>
    </div>

    <!-- Mobile header -->
    <div
      class="md:hidden fixed top-0 left-0 right-0 p-4 border-b border-border bg-background z-10"
    >
      <div class="flex items-center justify-between">
        <Button variant="outline" size="icon" @click="isOpen = true">
          <Menu class="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </div>

    <!-- Mobile Sidebar Sheet -->
    <Sheet :open="isOpen" @update:open="isOpen = $event">
      <SheetContent side="left" class="w-64 p-0">
        <div class="flex flex-col h-full">
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between mb-4">
              <Button
                class="flex-1 mr-6"
                variant="outline"
                @click="handleNewChat"
              >
                <Plus class="mr-2" />
                New Chat
              </Button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <div v-if="isLoadingConversations" class="text-center py-4">
              <span class="text-sm text-muted-foreground">Loading...</span>
            </div>
            <Button
              v-else
              v-for="conversation in conversations"
              :key="conversation.id"
              variant="ghost"
              class="w-full justify-start"
              :class="{
                'bg-accent': selectedConversationId === conversation.id,
              }"
              @click="handleConversationSelect(conversation.id)"
            >
              <MessageSquare class="mr-2" />
              {{
                conversation.name || "Conversation " + conversation.id.slice(-4)
              }}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col md:pt-0 pt-16">
      <div
        ref="chatContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4"
        @scroll="handleScroll"
      >
        <div
          v-if="isLoading && messages.length === 0"
          class="flex justify-center items-center h-full"
        >
          <div class="flex flex-col items-center space-y-4">
            <span class="relative flex h-8 w-8">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-8 w-8 bg-primary"
              ></span>
            </span>
            <span class="text-sm text-muted-foreground"
              >Loading conversation...</span
            >
          </div>
        </div>

        <ChatMessage
          v-else
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />

        <div
          v-if="isLoading && messages.length > 0"
          class="flex items-center space-x-2"
        >
          <span class="relative flex h-3 w-3">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-3 w-3 bg-primary"
            ></span>
          </span>
          <span class="text-sm text-muted-foreground">AI is typing...</span>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-border p-4">
        <form @submit.prevent="handleSendMessage" class="flex gap-2">
          <Input
            v-model="inputMessage"
            placeholder="Type your message..."
            class="flex-1"
            :disabled="isLoading"
          />
          <Button type="submit" :disabled="isLoading">
            <Send class="mr-2" />
            Send
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.h-screen {
  height: 100vh;
  height: 100dvh;
}
</style>
