<script setup>
import { MessageSquare } from "lucide-vue-next";

const props = defineProps({
  appInfo: {
    type: Object,
    required: true,
  },
});

const config = useRuntimeConfig();
const agentName = config.public.AGENT_NAME;
const agentDescription = config.public.AGENT_DESCRIPTION;
console.log(agentName, agentDescription);

</script>

<template>
  <div class="flex-1 flex items-center justify-center h-[calc(100vh-105px)]">
    <div
      class="flex flex-col items-center justify-center space-y-6 text-center p-8 max-w-2xl"
    >
      <div
        class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <MessageSquare class="w-8 h-8 text-primary" />
      </div>

      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">
          Welcome to {{ agentName }}
        </h1>
        <p class="text-muted-foreground text-lg">
          {{ agentDescription }}
        </p>
      </div>

      <div class="flex flex-col items-center space-y-4">
        <div
          class="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium"
        >
          <MessageSquare class="w-4 h-4 mr-2" />
          Start chatting below
        </div>
        <p class="text-xs text-muted-foreground">
          Your messages are private and encrypted
        </p>
      </div>
    </div>
  </div>
</template>
