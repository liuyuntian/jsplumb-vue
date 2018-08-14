<template>
  <div id="app" class="container">
    <t-header></t-header>
    <router-view></router-view>
  </div>
</template>

<script>
import Header from '@/components/common/Header';
export default {
  name: 'App',
  components: {
    't-header': Header,
  },
};
</script>

<style scoped>
.container {
  height: 100%;
  padding: 0 30px;
  margin: 0 auto;
}
</style>
