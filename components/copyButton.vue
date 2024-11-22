<script setup>
import { Check, Copy } from "lucide-vue-next";
import { ref } from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const copied = ref(false);

const copy = async () => {
  await navigator.clipboard.writeText(props.text);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    @click="copy"
    class="absolute right-2 top-2 h-8 w-8"
  >
    <Check v-if="copied" class="h-4 w-4" />
    <Copy v-else class="h-4 w-4" />
    <span class="sr-only">Copy code</span>
  </Button>
</template>
