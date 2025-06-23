<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  colors: {
    type: Array,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedColor = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    selectedColor.value = newValue
  }
)

function selectColor(color) {
  selectedColor.value = color
  emit('update:modelValue', color)
}
</script>

<template>
  <div class="color-picker" :style="`--number-of-colors: ${colors.length};`">
    <span>{{ label }}</span>
    <div
      v-for="(color, index) in colors"
      :key="index"
      class="color-box"
      @click="selectColor(color)"
    >
      <div
        :style="{ backgroundColor: color }"
        class="color"
        :class="{ selected: color == selectedColor }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.color-picker {
  --number-of-colors: 5;
  display: grid;
  grid-template-columns: auto repeat(var(--number-of-colors), 1rem);
  align-items: center;
  grid-gap: 0.5rem;
}

.color {
  cursor: pointer;
  width: 1rem;
  height: 1rem;
  border: 1px solid transparent;
  border-radius: 0.125rem;
}
.color:hover,
.color.selected {
}

.color.selected {
  border-color: #ffffff;
  box-shadow: 0 0 4px #000000;
}
</style>
