<script setup>
import { Sun, Moon, Laptop } from "lucide-vue-next";

const colorMode = useColorMode();

const toggleTheme = (theme) => {
  colorMode.preference = theme;
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon">
        <Sun
          v-if="colorMode.value === 'light'"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
        />
        <Moon
          v-if="colorMode.value === 'dark'"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
        />
        <Laptop
          v-if="colorMode.value === 'system'"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="toggleTheme('light')">
        <Sun class="mr-2 h-4 w-4" />
        <span>Light</span>
      </DropdownMenuItem>
      <DropdownMenuItem @click="toggleTheme('dark')">
        <Moon class="mr-2 h-4 w-4" />
        <span>Dark</span>
      </DropdownMenuItem>
      <DropdownMenuItem @click="toggleTheme('system')">
        <Laptop class="mr-2 h-4 w-4" />
        <span>System</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
