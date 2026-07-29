import csv
import random
from datetime import datetime, timedelta

random.seed(2025)  # 固定种子，保证每次生成数据一致（可删掉，则每次不同）

# 品牌、产品类别、型号及价格范围（单位：元）
brands = {
    '苹果': {
        '手机': [('iPhone 15', 5999, 8999), ('iPhone 15 Pro', 7999, 12999), ('iPhone 14', 4499, 6999)],
        '笔记本': [('MacBook Air M2', 7999, 10999), ('MacBook Pro 14', 12999, 19999)],
        '平板': [('iPad Pro 11', 6799, 8999), ('iPad Air', 4799, 6599)],
        '耳机': [('AirPods Pro 2', 1899, 1899), ('AirPods 3', 1399, 1399)]
    },
    '华为': {
        '手机': [('P60 Pro', 5988, 7988), ('Mate 60', 5499, 6999), ('Nova 12', 2999, 3999)],
        '笔记本': [('MateBook X Pro', 8999, 12999), ('MateBook 14', 5999, 7999)],
        '平板': [('MatePad Pro', 3999, 5999), ('MatePad 11', 2499, 3499)],
        '耳机': [('FreeBuds Pro 3', 1199, 1199), ('FreeBuds 5', 899, 899)],
        '手表': [('Watch GT 4', 1488, 2488), ('Watch Ultimate', 5999, 7999)]
    },
    '小米': {
        '手机': [('Xiaomi 14', 3999, 4999), ('Redmi K70', 2499, 3299), ('Xiaomi 13T', 2999, 3999)],
        '笔记本': [('RedmiBook Pro 15', 4999, 6999), ('Xiaomi Book Pro 16', 6499, 8999)],
        '平板': [('Xiaomi Pad 6', 1999, 2799), ('Redmi Pad', 999, 1599)],
        '耳机': [('Redmi Buds 4 Pro', 369, 499), ('Xiaomi Buds 3', 599, 699)],
        '手表': [('Xiaomi Watch S3', 799, 1299), ('Redmi Watch 4', 499, 799)]
    },
    '三星': {
        '手机': [('Galaxy S24', 5999, 7999), ('Galaxy Z Flip5', 7499, 9999), ('Galaxy A55', 2999, 3999)],
        '平板': [('Galaxy Tab S9', 4999, 6999), ('Tab A9', 1999, 2999)],
        '耳机': [('Galaxy Buds2 Pro', 1299, 1299), ('Buds FE', 699, 699)],
        '手表': [('Galaxy Watch 6', 1999, 2999)]
    },
    '联想': {
        '笔记本': [('ThinkPad X1 Carbon', 9999, 14999), ('小新Pro 16', 4999, 6999), ('拯救者Y9000P', 8999, 12999)],
        '平板': [('Yoga Tab 13', 3999, 4999), ('小新Pad Pro', 2299, 3299)]
    },
    '戴尔': {
        '笔记本': [('XPS 13', 7999, 11999), ('Inspiron 15', 3999, 5999), ('Alienware m16', 13999, 19999)],
        '显示器': [('UltraSharp 27', 2999, 3999), ('S2721QS', 2199, 2799)]
    },
    '惠普': {
        '笔记本': [('Spectre x360', 8999, 12999), ('暗影精灵9', 6999, 9999), ('Envy 16', 7999, 10999)],
        '显示器': [('E27u G5', 1999, 2799), ('X27q', 1599, 1999)]
    },
    '索尼': {
        '耳机': [('WH-1000XM5', 1999, 1999), ('WF-1000XM5', 1599, 1599), ('LinkBuds S', 1099, 1099)],
        '手机': [('Xperia 1 V', 7999, 9999), ('Xperia 5 V', 5999, 6999)]
    },
    'OPPO': {
        '手机': [('Find X7 Ultra', 5999, 7999), ('Reno 11', 2999, 3999), ('A3', 1599, 1999)],
        '耳机': [('Enco X2', 899, 1099), ('Enco Air3', 299, 399)],
        '手表': [('Watch 4 Pro', 1999, 2499)]
    },
    'vivo': {
        '手机': [('X100 Pro', 4999, 6999), ('S18', 2499, 3299), ('Y100', 1499, 1999)],
        '耳机': [('TWS 3', 499, 699), ('TWS Air', 199, 299)]
    },
    '荣耀': {
        '手机': [('Magic6 Pro', 5699, 7699), ('90 GT', 2599, 3599), ('X50', 1399, 1999)],
        '笔记本': [('MagicBook Pro 16', 5999, 7999), ('MagicBook X 14', 3999, 4999)],
        '平板': [('Pad 9', 1999, 2799), ('Pad X9', 1299, 1699)],
        '手表': [('Watch 4', 999, 1499), ('Band 7', 299, 399)]
    }
}

# 省份及城市
provinces_cities = {
    '北京': ['北京市'],
    '上海': ['上海市'],
    '广东': ['广州', '深圳', '东莞', '佛山', '珠海'],
    '浙江': ['杭州', '宁波', '温州', '嘉兴'],
    '江苏': ['南京', '苏州', '无锡', '常州'],
    '山东': ['济南', '青岛', '烟台', '潍坊'],
    '河南': ['郑州', '洛阳', '新乡'],
    '四川': ['成都', '绵阳', '宜宾'],
    '湖北': ['武汉', '襄阳', '宜昌'],
    '湖南': ['长沙', '株洲', '衡阳', '常德'],
    '福建': ['福州', '厦门', '泉州'],
    '安徽': ['合肥', '芜湖', '蚌埠'],
    '河北': ['石家庄', '唐山', '保定'],
    '陕西': ['西安', '宝鸡'],
    '重庆': ['重庆市'],
    '辽宁': ['沈阳', '大连']
}

# 销售渠道
channels = ['京东', '天猫', '品牌官网', '线下专卖店', '电器城', '拼多多']

# 生成经销商名称
def gen_dealer(brand, city, channel):
    if channel in ['京东', '天猫', '品牌官网', '拼多多']:
        return f"{channel}平台"
    else:
        # 线下随机分给专卖店或电器城
        if random.random() > 0.5:
            return f"{city}{brand}专卖店"
        else:
            return f"{city}电器城"

rows = []
start_date = datetime(2025, 1, 1)
end_date = datetime(2025, 12, 31)
total_days = (end_date - start_date).days

for _ in range(1000):
    days_offset = random.randint(0, total_days)
    date = start_date + timedelta(days=days_offset)
    date_str = date.strftime('%Y-%m-%d')

    brand = random.choice(list(brands.keys()))
    brand_data = brands[brand]                       # 品牌下的所有类别字典
    category = random.choice(list(brand_data.keys()))   # 随机选一个类别，如 '手机'
    model_info = random.choice(brand_data[category])   # 从该类别的型号列表中随机取一个元组
    model = model_info[0]
    price = round(random.uniform(model_info[1], model_info[2]), 0)   # 价格取整
    quantity = random.randint(1, 15)
    sales_amount = round(price * quantity, 0)

    province = random.choice(list(provinces_cities.keys()))
    city = random.choice(provinces_cities[province])
    channel = random.choice(channels)
    dealer = gen_dealer(brand, city, channel)

    rows.append([date_str, brand, category, model, quantity, int(price), int(sales_amount),
                 province, city, channel, dealer])

# 按日期排序
rows.sort(key=lambda x: x[0])

# 写入CSV（UTF-8 with BOM，Excel可直接打开）
with open('电子产品销售情况统计表.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    writer.writerow(['日期', '品牌', '产品类别', '产品型号', '销售数量', '单价(元)', '销售额(元)',
                     '省份', '城市', '销售渠道', '经销商'])
    writer.writerows(rows)

print("✅ 已生成 电子产品销售情况统计表.csv，共 1000 条销售记录。")
