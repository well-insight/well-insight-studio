<script setup lang="ts">
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style lang="scss">
@use './styles/index.scss';
#app {
  width: 100%;
  height: 100%;
  //border: 1px solid ridge;
  color: #575a64;
  background-color: #f6f8f9;
}

// white-theme:
// nobg-color: #575a64;
// bgc: #0ca296;
// color: #ffffff;
// font color: #575a64
</style>
