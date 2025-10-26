import Mock from 'mockjs'
import { defineMock } from 'vite-plugin-mock-dev-server'

function requestFormatter(data: unknown) {
  return JSON.stringify({ code: 200, message: 'OK', data })
}

export default defineMock([
  {
    url: '/api/test/get',
    delay: 1000,
    response(_, res) {
      res.end(
        requestFormatter(
          { a: 1000 },
        ),
      )
    },
  },
  {
    url: '/api/system/login',
    delay: 1000,
    method: 'POST',
    response(req, res) {
      const { username, password } = req.body
      if (username === 'admin' && password === '123456') {
        res.end(
          requestFormatter({
            user: {
              username: 'admin',
              showname: '管理员',
              code: 'ADMIN',
            },
            token: 'xxxxx-xxxxx-xxxx-xxx',
          }),
        )
      }
    },
  },

  // menuList信息
  {
    url: 'api/system/getMenuList',
    method: 'POST',
    response: (_, res) => {
      res?.end(requestFormatter([
        {
          title: '我的设计',
          icon: 'myDesign',
          router: '/weiDesign',
        },
        {
          title: '模板市场',
          icon: 'tplMarket',
          router: '/tplMarket',
        },
        {
          title: '组件',
          icon: 'assembly',
          router: '/assembly',
        },
        {
          title: '数据集',
          icon: 'boardsheet',
          router: '/boardsheet',
        },
        {
          title: '系统信息',
          icon: 'index',
          router: '/systemInfo',
        },
      ]))
    },
  },
  {
    url: '/api/design/findDesignList',
    delay: 1000,
    response(req, res) {
      const data = Mock.mock({
        'list|10': [
          {
            'id': '@id',
            'title': '@ctitle(6, 12)',
            'img': '@image("300x200", "#50B347", "#FFF", "Mock")',
            'width|1920-3840': 1920,
            'height|1080-2160': 1080,
            'backgroundColor': '@color',
            'adapter|1': ['mobile', 'desktop', 'tablet'],
            'theme|1': ['light', 'dark', 'nature', 'warm', 'cold', 'ocean', 'spring', 'autumn'],
            'status|1': ['published', 'draft', 'archived'],
          },
        ],
      })
      res.end(requestFormatter(data?.list))
    },
  },

  {
    url: '/dev-api/auth/login',
    delay: 1000,
    method: 'POST',
    response(req, res) {
      res.end(
        requestFormatter({
          userId: '****',
          userName: '****',
          roleCode: '****',
          roleName: '****',
          dept: '****',
          menuList: [
            {
              menuName: '党办',
              menuCode: '01',
              startTime: '2025-01-01 08:00:00',
              endTime: '2025-01-03 08:00:00',
              status: 0, // 0是开启访问，1是未开启访问
            },
          ],
        }),
      )
    },
  },
  {
    url: '/dev-api/civilized/get-target-org',
    delay: 1000,
    method: 'GET',
    response(req, res) {
      const dataList = Mock.mock({
        'list|35': [
          {
            orgId: '1667176375826404435',
            name: '数智化事业部',
            status: 1,
            orgType: '生产单位',
          },
        ],
      })
      res.end(requestFormatter(dataList.list))
    },
  },
  {
    url: '/dev-api/civilized/get-rating-item',
    delay: 1000,
    method: 'GET',
    response(req, res) {
      res.end(
        requestFormatter([
          {
            type: '班子建设',
            status: 0,
            itemList: [
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
            ],
          },
          {
            type: '思想道德 文化建设',
            status: 0,
            itemList: [
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
            ],
          },
          {
            type: '民主法治建设',
            status: 0,
            itemList: [
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
            ],
          },
          {
            type: '经营开拓 生产组织 质量安全 技术创新',
            status: 0,
            itemList: [
              {
                itemCode: '0101',
                itemName: '政治素质好',
                type: '经营开拓 生产组织 质量安全 技术创新',
                description:
                  '有坚定的马克思主义理想信念，贯彻执行党的路线、方针、政策和集团公司的决策、规定，政治核心作用发挥好；用习近平新时代中国特色社会主义思想指导各项工作，实现本单位健康协调发展。',
                scoreRange: 5,
                currentScore: 2,
                remark: null,
              },
            ],
          },
        ]),
      )
    },
  },
  {
    url: '/dev-api/civilized/rating-save',
    delay: 1000,
    method: 'POST',
    response(req, res) {
      res.end(requestFormatter('保存成功'))
    },
  },
  {
    url: '/dev-api/org/get-rating-result',
    delay: 1000,
    method: 'GET',
    response(req, res) {
      res.end(
        requestFormatter([
          {
            orgId: '1667176375826404435',
            name: '总包事业部',
            score: 99,
            orgType: '生产单位',
          },
          {
            orgId: '1132817637582640443',
            name: '数智化事业部',
            score: 100,
            orgType: '事业部',
          },
        ]),
      )
    },
  },
  {
    url: '/dev-api/org/rating-commit',
    delay: 1000,
    method: 'POST',
    response(req, res) {
      res.end(requestFormatter('保存成功'))
    },
  },
  {
    url: '/dev-api/leader/get-rating-result',
    delay: 1000,
    method: 'GET',
    response(req, res) {
      res.end(
        requestFormatter([
          {
            orgId: '1667176375826404435',
            name: '张三',
            score: 99,
            orgType: '生产单位',
          },
          {
            orgId: '1132817637582640443',
            name: '李四',
            score: 100,
            orgType: '事业部',
          },
        ]),
      )
    },
  },
  {
    url: '/dev-api/leader/rating-commit',
    delay: 1000,
    method: 'POST',
    response(req, res) {
      res.end(requestFormatter('保存成功'))
    },
  },
  {
    url: '/dev-api/civilized/rating-publish',
    delay: 1000,
    method: 'POST',
    response(req, res) {
      res.end(requestFormatter('提交成功'))
    },
  },
  {
    url: '/dev-api/civilized/get-rating-reset',
    delay: 1000,
    method: 'POST',
    response(req, res) {
      res.end(requestFormatter('重置成功'))
    },
  },
])
