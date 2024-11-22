<script setup>
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useToast } from "@/components/ui/toast/use-toast";

const { toast } = useToast();
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
});

const { $hljs } = useNuxtApp();

const isAI = computed(() => props.message.role === "assistant");

const handleCopyClick = (event) => {
  const button = event.target.closest(".copy-button");
  if (button) {
    const codeId = button.getAttribute("data-code-id");
    const codeElement = document.getElementById(codeId);
    if (codeElement) {
      copyToClipboard(codeElement);
    }
  }
};

const copyToClipboard = async (codeElement) => {
  try {
    const code = codeElement.textContent;
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
      duration: 2000,
    });
  } catch (err) {
    console.error("Failed to copy:", err);
    toast({
      title: "Error",
      description: "Failed to copy code",
      variant: "destructive",
      duration: 2000,
    });
  }
};

const formattedContent = computed(() => {
  if (!props.message.content) return "";
  try {
    const renderer = new marked.Renderer();

    renderer.code = (code, language) => {
      const codeContent = typeof code === "object" ? code.text : String(code);
      const uniqueId = "code-" + Math.random().toString(36).substr(2, 9);
      const highlighted = $hljs(codeContent, code.lang);

      return `
        <div class="code-block-wrapper">
          <button class="copy-button" data-code-id="${uniqueId}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
          <pre><code id="${uniqueId}" class="language-${code.lang}">${highlighted}</code></pre>
        </div>`;
    };

    const rawHtml = marked(props.message.content, { renderer });
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ["data-code-id", "class"], // Allow class attribute
    });
  } catch (e) {
    console.error("Marking error:", e);
    return props.message.content;
  }
});
</script>

<template>
  <div
    :class="[
      'flex gap-4 p-4 rounded-lg w-full max-w-full',
      isAI ? 'bg-muted' : 'bg-background'
    ]"
  >
    <Avatar>
      <AvatarImage :src="isAI ? '/ai-avatar.png' : '/user-avatar.png'" />
      <AvatarFallback>{{ isAI ? "AI" : "You" }}</AvatarFallback>
    </Avatar>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium mb-1">
        {{ isAI ? "AI Assistant" : "You" }}
      </p>
      <div
        class="prose prose-sm dark:prose-invert max-w-none break-words"
        v-html="formattedContent"
        @click="handleCopyClick"
      />
    </div>
    <Toaster />
  </div>
</template>

<style>
/* Base code styles */
.prose pre {
  @apply p-4 rounded-lg relative border border-border;
  @apply dark:bg-zinc-900 bg-zinc-800;
  @apply overflow-x-auto;
  @apply max-w-full;
  margin: 1em 0;
  -webkit-overflow-scrolling: touch;
}

.prose {
  @apply px-2;
}

.prose code {
  @apply bg-muted px-1.5 py-0.5 rounded text-sm font-mono;
}

.prose pre code {
  @apply bg-transparent p-0 text-sm;
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
}

/* HLJS specific styles */
.hljs {
  @apply block overflow-x-auto p-0;
  background: transparent !important;
}

/* Override HLJS theme colors if needed */
.hljs-keyword,
.hljs-function {
  @apply text-purple-400;
}

.hljs-string {
  @apply text-green-400;
}

.hljs-number {
  @apply text-orange-400;
}

.hljs-comment {
  @apply text-gray-500;
}

/* Rest of your styles... */
.prose :not(pre) > code {
  @apply text-primary;
}

.prose ul {
  @apply list-disc list-outside ml-4;
}

.prose ol {
  @apply list-decimal list-outside ml-4;
}

.prose a {
  @apply text-primary hover:underline;
}

.prose blockquote {
  @apply border-l-4 border-primary pl-4 italic;
}

.prose table {
  @apply w-full border-collapse;
}

.prose th,
.prose td {
  @apply border border-border p-2;
}

.prose th {
  @apply bg-muted;
}

/* Add these new styles */
.code-block-wrapper {
  @apply relative;
}

.copy-button {
  @apply absolute right-2 top-2 p-2 rounded-lg opacity-50 hover:opacity-100 transition-opacity z-10;
  @apply bg-slate-700 dark:bg-zinc-700 text-white;
}

.copy-icon {
  @apply w-4 h-4;
}
</style>
