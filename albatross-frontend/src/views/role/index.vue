<template>
  <div>
    <el-button type="primary" @click="handleAuthorize('dev')">开发人员</el-button>
    <el-button type="primary" @click="handleAuthorize('test')">测试人员</el-button>
  </div>
</template>

<script>
export default {
  components: {},

  mixins: [],

  props: {},

  data: () => ({}),

  computed: {},

  watch: {},

  created() {
  },

  mounted() {
  },

  destroyed() {
  },

  methods: {
    handleAuthorize(roleId) {
      this.$router.push({
        name: 'SysPermission',
        params: {
          roleId: roleId
        }
      })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
