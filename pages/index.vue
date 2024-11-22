<script setup>
import {
  Plus,
  MessageSquare,
  Send,
  Menu,
  Image as ImageIcon,
  X,
  User,
  Square,
  Trash2,
} from "lucide-vue-next";

const config = useRuntimeConfig();
const agentName = config.public.AGENT_NAME;
const agentDescription = config.public.AGENT_DESCRIPTION;

useSeoMeta({
  title: `Chat UI - ${agentName}`,
  description: agentDescription,
  ogTitle: `Chat UI - ${agentName}`,
  ogDescription: agentDescription,
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
});

const messages = ref([]);
const inputMessage = ref("");
const isOpen = ref(false);
const isLoading = ref(false);
const conversationId = ref(null);
const chatContainer = ref(null);
const shouldAutoScroll = ref(true);
const { isAtBottom } = useScroll();

const {
  sendMessage,
  fetchMessageHistory,
  uploadImage,
  fetchApplicationInfo,
  fetchSuggestedQuestions,
  stopMessageGeneration,
  deleteConversation,
} = useDify();
const {
  conversations,
  isLoading: isLoadingConversations,
  fetchConversations,
  listKey,
} = useConversations();
const selectedConversationId = ref(null);
const fileInput = ref(null);
const selectedImage = ref(null);
const appInfo = ref(null);
const suggestedQuestions = ref([]);
const currentTaskId = ref(null);
const isGenerating = ref(false);

onMounted(async () => {
  fetchConversations();
  try {
    appInfo.value = await fetchApplicationInfo();
    // Store the app info in the local storage
    localStorage.setItem("appInfo", JSON.stringify(appInfo.value));
  } catch (error) {
    console.error("Error fetching application info:", error);
  }
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

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    selectedImage.value = file;
  } else {
    console.error("Please select an image file");
  }
};

const stopGeneration = async () => {
  if (currentTaskId.value) {
    try {
      await stopMessageGeneration(currentTaskId.value);
      isGenerating.value = false;
      isLoading.value = false;

      // Refresh conversation history after stopping
      if (conversationId.value) {
        const history = await fetchMessageHistory(conversationId.value);
        messages.value = history;
      }
      // Refresh conversations list
      fetchConversations();

      currentTaskId.value = null;
    } catch (error) {
      console.error("Error stopping generation:", error);
    }
  }
};

const handleSendMessage = async () => {
  if ((!inputMessage.value.trim() && !selectedImage.value) || isLoading.value)
    return;

  shouldAutoScroll.value = true;
  isLoading.value = true;
  isGenerating.value = true;
  currentTaskId.value = null;

  let userMessage = inputMessage.value;
  let imageUrl = null;

  if (selectedImage.value) {
    try {
      const uploadResult = await uploadImage(selectedImage.value);
      imageUrl = uploadResult.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      return;
    } finally {
      selectedImage.value = null;
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    }
  }

  inputMessage.value = "";

  messages.value.push({
    id: Date.now(),
    content: userMessage,
    role: "user",
    image: imageUrl,
  });

  nextTick(() => {
    scrollToBottom();
  });

  try {
    const response = await sendMessage(
      userMessage,
      conversationId.value,
      imageUrl
    );
    const reader = response.getReader();
    let assistantMessage = "";

    const assistantMessageId = Date.now();
    messages.value.push({
      id: assistantMessageId,
      content: "",
      role: "assistant",
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        try {
          const lastMessage = messages.value[messages.value.length - 1];
          if (lastMessage && lastMessage.message_id) {
            const suggestions = await fetchSuggestedQuestions(
              lastMessage.message_id
            );
            suggestedQuestions.value = suggestions.data || [];
          }
        } catch (error) {
          console.error("Error fetching suggested questions:", error);
          suggestedQuestions.value = [];
        }
        break;
      }

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
              const lastMessage = messages.value[messages.value.length - 1];
              if (lastMessage && lastMessage.id === assistantMessageId) {
                Object.assign(lastMessage, {
                  content: assistantMessage,
                  message_id: data.message_id,
                  metadata: data.metadata,
                  created_at: data.created_at,
                });

                if (shouldAutoScroll.value) {
                  nextTick(() => {
                    scrollToBottom();
                  });
                }
              }
            }
            if (data.task_id && !currentTaskId.value) {
              currentTaskId.value = data.task_id;
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
    suggestedQuestions.value = [];
  } finally {
    isLoading.value = false;
    isGenerating.value = false;
    currentTaskId.value = null;
    // Refresh conversations list
    fetchConversations();
  }
};

const handleConversationSelect = async (id) => {
  try {
    selectedConversationId.value = id;
    conversationId.value = id;
    isOpen.value = false;

    messages.value = [];
    isLoading.value = true;

    const history = await fetchMessageHistory(id);

    messages.value = history;

    shouldAutoScroll.value = true;

    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error("Error loading conversation:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleNewChat = () => {
  selectedConversationId.value = null;
  conversationId.value = null;
  messages.value = [];
};

const removeSelectedImage = () => {
  selectedImage.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// Add computed property for image preview URL
const imagePreviewUrl = computed(() => {
  if (selectedImage.value) {
    return window.URL.createObjectURL(selectedImage.value);
  }
  return null;
});

// Clean up object URL when image is removed or changed
watch(selectedImage, (newImage, oldImage) => {
  if (oldImage) {
    URL.revokeObjectURL(URL.createObjectURL(oldImage));
  }
});

// Cleanup on component unmount
onBeforeUnmount(() => {
  if (selectedImage.value) {
    URL.revokeObjectURL(URL.createObjectURL(selectedImage.value));
  }
});

// Add computed property for agent avatar
const agentAvatar = computed(() => {
  return appInfo.value?.avatar_url || null;
});

// Modify handleDeleteConversation to use the listKey from composable
const handleDeleteConversation = async (conversationId) => {
  try {
    await deleteConversation(conversationId);
    // If we're deleting the current conversation, reset the view
    if (conversationId === selectedConversationId.value) {
      handleNewChat();
    }
    fetchConversations();
  } catch (error) {
    console.error("Error deleting conversation:", error);
  }
};
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Mobile header - adjust padding and z-index -->
    <div
      class="md:hidden fixed top-0 left-0 right-0 p-2 border-b border-border bg-background z-50"
    >
      <div class="flex items-center justify-between">
        <Button variant="outline" size="icon" @click="isOpen = true">
          <Menu class="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </div>

    <!-- Desktop Sidebar - hide on mobile -->
    <div class="hidden md:flex w-64 border-r border-border flex-col">
      <!-- Main sidebar content -->
      <div class="p-4 flex-1">
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
          <TransitionGroup
            v-else
            :key="listKey"
            name="conversation-list"
            tag="div"
            class="space-y-2"
          >
            <div
              v-for="conversation in conversations"
              :key="conversation.id"
              class="group flex items-center"
            >
              <Button
                variant="ghost"
                class="flex-1 justify-start"
                :class="{
                  'bg-accent': selectedConversationId === conversation.id,
                }"
                @click="handleConversationSelect(conversation.id)"
              >
                <MessageSquare class="mr-2 h-4 w-4" />
                <span class="truncate">
                  {{
                    conversation.name ||
                    "Conversation " + conversation.id.slice(-4)
                  }}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -ml-10"
                @click="handleDeleteConversation(conversation.id)"
              >
                <Trash2 class="h-4 w-4" />
                <span class="sr-only">Delete conversation</span>
              </Button>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Agent info section at bottom -->
      <div class="p-4">
        <Separator class="mb-4" />
        <div class="flex items-center space-x-3">
          <Avatar class="h-10 w-10">
            <AvatarImage :src="agentAvatar" v-if="agentAvatar" />
            <AvatarFallback>
              <User class="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div class="space-y-1">
            <p class="text-sm font-medium leading-none">{{ agentName }}</p>
            <p class="text-xs text-muted-foreground line-clamp-1">
              {{ agentDescription }}
            </p>
          </div>
        </div>
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
            <TransitionGroup
              v-else
              :key="listKey"
              name="conversation-list"
              tag="div"
              class="space-y-2"
            >
              <div
                v-for="conversation in conversations"
                :key="conversation.id"
                class="group flex items-center"
              >
                <Button
                  variant="ghost"
                  class="flex-1 justify-start"
                  :class="{
                    'bg-accent': selectedConversationId === conversation.id,
                  }"
                  @click="handleConversationSelect(conversation.id)"
                >
                  <MessageSquare class="mr-2 h-4 w-4" />
                  <span class="truncate">
                    {{
                      conversation.name ||
                      "Conversation " + conversation.id.slice(-4)
                    }}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -ml-10"
                  @click="handleDeleteConversation(conversation.id)"
                >
                  <Trash2 class="h-4 w-4" />
                  <span class="sr-only">Delete conversation</span>
                </Button>
              </div>
            </TransitionGroup>
          </div>

          <!-- Add agent info to mobile sidebar -->
          <div class="p-4 border-t border-border">
            <Separator class="my-2" />
            <div class="flex items-center space-x-3">
              <Avatar class="h-10 w-10">
                <AvatarImage :src="agentAvatar" v-if="agentAvatar" />
                <AvatarFallback>
                  <User class="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none">{{ agentName }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ agentDescription }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Main Chat Area - adjust padding and height -->
    <div class="flex-1 flex flex-col md:pt-0 pt-12">
      <div
        ref="chatContainer"
        class="flex-1 overflow-y-auto p-2 md:p-4 space-y-4"
        @scroll="handleScroll"
      >
        <div class="max-w-5xl mx-auto w-full">
          <div
            v-if="!isLoading && messages.length === 0 && appInfo"
            class="flex-1 flex items-center justify-center"
          >
            <WelcomeMessage :app-info="appInfo" />
          </div>

          <ChatMessage
            v-else
            v-for="message in messages"
            :key="message.id"
            :message="message"
          />

          <SuggestedQuestions
            v-if="
              messages.length > 0 &&
              messages[messages.length - 1].role === 'assistant' &&
              suggestedQuestions.length > 0
            "
            :questions="suggestedQuestions"
            @select="
              (question) => {
                inputMessage = question;
                handleSendMessage();
              }
            "
            class="mt-2"
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
      </div>

      <!-- Input Area - adjust padding -->
      <div class="border-t border-border p-2 md:p-4">
        <div v-if="selectedImage" class="mb-2 relative inline-block">
          <img
            :src="imagePreviewUrl"
            class="h-20 w-20 object-cover rounded-lg border border-border"
            alt="Selected image"
          />
          <button
            @click="removeSelectedImage"
            class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
          >
            <span class="sr-only">Remove image</span>
            <X class="h-4 w-4" />
          </button>
        </div>

        <form @submit.prevent="handleSendMessage" class="flex gap-2">
          <Textarea
            v-model="inputMessage"
            placeholder="Type your message..."
            class="flex-1 min-h-[44px] resize-none"
            :rows="1"
            :style="{ fontSize: '16px' }"
            :disabled="isLoading"
            @keydown.enter.prevent="handleSendMessage"
          />
          <Button
            v-if="isGenerating"
            type="button"
            variant="destructive"
            class="h-[44px]"
            @click="stopGeneration"
          >
            <Square class="mr-2 h-4 w-4" />
            Stop
          </Button>
          <Button v-else type="submit" :disabled="isLoading" class="h-[44px]">
            <Send class="mr-2" />
            Send
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Update height calculation for mobile */
.h-screen {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
  overflow: hidden; /* Prevent scrolling of main container */
}

/* Ensure mobile sheet takes full height */
:deep(.sheet-content) {
  height: 100dvh !important;
}

/* Transition animations */
.conversation-list-move, /* apply transition to moving elements */
.conversation-list-enter-active,
.conversation-list-leave-active {
  transition: all 0.3s ease;
}

.conversation-list-enter-from,
.conversation-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly */
.conversation-list-leave-active {
  position: absolute;
}

/* Add these styles */
input,
textarea {
  font-size: 16px !important; /* Force minimum font size */
  touch-action: manipulation; /* Disable double-tap zoom */
}
</style>
