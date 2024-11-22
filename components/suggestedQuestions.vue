<script setup>
const props = defineProps({
  questions: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <div v-if="questions.length > 0" class="flex flex-wrap gap-2">
    <Button
      v-for="question in questions"
      :key="question"
      variant="outline"
      size="sm"
      @click="$emit('select', question)"
      class="text-sm"
    >
      {{ question }}
    </Button>
  </div>
</template>
