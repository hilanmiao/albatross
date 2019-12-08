<!--<template>-->
<!--  <div>-->
<!--    <router-link to="/sys/role">-->
<!--      <el-button type="text" icon="el-icon-back">返回角色管理页面</el-button>-->
<!--    </router-link>-->

<!--    {{ roleId }}-->

<!--    <el-tree-->
<!--      ref="tree"-->
<!--      :check-strictly="checkStrictly"-->
<!--      :data="routesData"-->
<!--      show-checkbox-->
<!--      default-expand-all-->
<!--      node-key="identification"-->
<!--      highlight-current-->
<!--      :props="defaultProps"-->
<!--    />-->

<!--    &lt;!&ndash; 限制两级菜单，所以下面很多代码没有用递归 &ndash;&gt;-->
<!--  </div>-->
<!--</template>-->

<!--<script>-->
<!--import i18n from '@/lang'-->
<!--import { asyncRoutes, asyncPermissionsButton, asyncPermissionApi } from '../../router'-->
<!--import { getPermissions } from '../../api/role-permission'-->

<!--export default {-->
<!--  components: {},-->

<!--  mixins: [],-->

<!--  props: {},-->

<!--  data: () => ({-->
<!--    roleId: null,-->
<!--    checkStrictly: false,-->
<!--    defaultProps: {-->
<!--      children: 'children',-->
<!--      label: 'title'-->
<!--    },-->
<!--    routes: []-->
<!--  }),-->

<!--  computed: {-->
<!--    routesData() {-->
<!--      return this.routes-->
<!--    }-->
<!--  },-->

<!--  watch: {},-->

<!--  created() {-->
<!--  },-->

<!--  mounted() {-->
<!--    this.roleId = this.$route.params.roleId-->
<!--    this.getRoutes()-->
<!--    this.getApis()-->
<!--  },-->

<!--  destroyed() {-->
<!--  },-->

<!--  methods: {-->
<!--    getApis() {-->
<!--      const apis = asyncPermissionApi-->
<!--      console.log(apis)-->
<!--    },-->
<!--    getRoutes() {-->
<!--      const routes = this.generateRoutes(asyncRoutes)-->
<!--      this.routes = this.i18n(routes)-->
<!--      console.log(this.routes)-->

<!--      // 获取服务端权限列表,并更新-->
<!--      this.checkStrictly = true-->
<!--      this.$nextTick(async() => {-->
<!--        // 服务端获取权限-->
<!--        const permissions = await getPermissions()-->
<!--        // 匹配路由-->
<!--        const routes = this.filterRoutes(permissions)-->
<!--        console.log(routes)-->
<!--        this.$refs.tree.setCheckedNodes(this.generateArr(routes))-->
<!--        // set checked state of a node not affects its father and child nodes-->
<!--        this.checkStrictly = false-->
<!--      })-->
<!--    },-->
<!--    filterRoutes(permissions) {-->
<!--      // 3级的数组-->
<!--      const routes = this.generateRoutes(asyncRoutes)-->

<!--      // 筛选1级目录或菜单-->
<!--      const routesFilter = []-->
<!--      routes.forEach(route => {-->
<!--        if (route.onlyOneShowingChild || route.type === 'd') {-->
<!--          if (permissions.some(permission => permission.identification === route.identification)) {-->
<!--            routesFilter.push(route)-->
<!--          }-->
<!--        }-->
<!--      })-->
<!--      console.log(routesFilter)-->

<!--      // 筛选2级菜单或目录-->
<!--      routesFilter.forEach(route => {-->
<!--        if (!route.onlyOneShowingChild) {-->
<!--          const children = []-->
<!--          route.children.forEach((routeChildren) => {-->
<!--            if (permissions.some(permission => permission.identification === routeChildren.identification)) {-->
<!--              children.push(routeChildren)-->
<!--            }-->
<!--          })-->

<!--          route.children = children-->
<!--        }-->
<!--      })-->

<!--      console.log(routesFilter)-->

<!--      // 筛选3级按钮-->
<!--      routesFilter.forEach(route => {-->
<!--        if (!route.onlyOneShowingChild) {-->
<!--          route.children.forEach(routeChildren => {-->
<!--            const children = []-->
<!--            routeChildren.children.forEach((routeChildrenBtn) => {-->
<!--              if (permissions.some(permission => permission.identification === routeChildrenBtn.identification)) {-->
<!--                children.push(routeChildrenBtn)-->
<!--              }-->
<!--            })-->

<!--            routeChildren.children = children-->
<!--          })-->
<!--        }-->
<!--      })-->

<!--      console.log(routesFilter)-->

<!--      return routesFilter-->
<!--    },-->
<!--    generateRoutes(routes) {-->
<!--      const res = []-->

<!--      for (const route of routes) {-->
<!--        if (route.hidden) {-->
<!--          continue-->
<!--        }-->

<!--        let data = {-->
<!--          children: []-->
<!--        }-->

<!--        if (route.children.length === 1) {-->
<!--          if (route.children[0].hidden) {-->
<!--            continue-->
<!--          }-->
<!--          data = {-->
<!--            title: route.children[0].meta && route.children[0].meta.title,-->
<!--            identification: route.children[0].meta.identification,-->
<!--            type: route.children[0].meta.type,-->
<!--            children: this.generateRouteButtons(route.children[0].meta.identification),-->
<!--            onlyOneShowingChild: true-->
<!--          }-->
<!--        } else {-->
<!--          data = {-->
<!--            title: route.meta && route.meta.title,-->
<!--            identification: route.meta.identification,-->
<!--            type: route.meta.type,-->
<!--            children: []-->
<!--          }-->

<!--          for (const routeChildren of route.children) {-->
<!--            if (routeChildren.hidden) {-->
<!--              continue-->
<!--            }-->

<!--            const dataChildren = {-->
<!--              title: routeChildren.meta && routeChildren.meta.title,-->
<!--              identification: routeChildren.meta.identification,-->
<!--              type: routeChildren.meta.type,-->
<!--              children: this.generateRouteButtons(routeChildren.meta.identification)-->
<!--            }-->

<!--            data.children.push(dataChildren)-->
<!--          }-->
<!--        }-->

<!--        res.push(data)-->
<!--      }-->

<!--      return res-->
<!--    },-->

<!--    generateRouteButtons(module) {-->
<!--      console.log(asyncPermissionsButton)-->

<!--      let buttons = []-->

<!--      asyncPermissionsButton.some(item => {-->
<!--        if (item.module === module) {-->
<!--          // 因为数组内是复杂对象，所以解构、Object.assign等方法是无效的-->
<!--          buttons = JSON.parse(JSON.stringify(item.buttons))-->
<!--          return true-->
<!--        }-->
<!--      })-->

<!--      return buttons-->
<!--    },-->

<!--    generateArr(routes) {-->
<!--      let data = []-->
<!--      routes.forEach(route => {-->
<!--        data.push(route)-->
<!--        if (route.children) {-->
<!--          const temp = this.generateArr(route.children)-->
<!--          if (temp.length > 0) {-->
<!--            data = [...data, ...temp]-->
<!--          }-->
<!--        }-->
<!--      })-->
<!--      return data-->
<!--    },-->

<!--    i18n(routes) {-->
<!--      const app = routes.map(route => {-->
<!--        let prefix = ''-->
<!--        if (route.type === 'b') {-->
<!--          prefix = 'permissionButtons'-->
<!--        } else if (route.type === 'a') {-->
<!--          prefix = 'permissionApis'-->
<!--        } else {-->
<!--          prefix = 'route'-->
<!--        }-->
<!--        route.title = i18n.t(`${prefix}.${route.title}`)-->
<!--        if (route.children) {-->
<!--          route.children = this.i18n(route.children)-->
<!--        }-->
<!--        return route-->
<!--      })-->
<!--      return app-->
<!--    },-->
<!--    // reference: src/view/layout/components/Sidebar/SidebarItem.vue-->
<!--    onlyOneShowingChild(children = [], parent) {-->
<!--      let onlyOneChild = null-->
<!--      const showingChildren = children.filter(item => !item.hidden)-->

<!--      // When there is only one child route, the child route is displayed by default-->
<!--      if (showingChildren.length === 1) {-->
<!--        onlyOneChild = showingChildren[0]-->
<!--        // 唯一标识-->
<!--        onlyOneChild.identification = onlyOneChild.meta.identification-->
<!--        return onlyOneChild-->
<!--      }-->

<!--      // Show parent if there are no child route to display-->
<!--      if (showingChildren.length === 0) {-->
<!--        onlyOneChild = { ...parent, path: '', noShowingChildren: true }-->
<!--        return onlyOneChild-->
<!--      }-->

<!--      return false-->
<!--    }-->
<!--  }-->
<!--}-->
<!--</script>-->

<!--<style rel="stylesheet/scss" lang="scss" scoped>-->

<!--</style>-->
