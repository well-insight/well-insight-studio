import csv
import random
from datetime import datetime, timedelta

random.seed(42)  # 固定种子，每次生成相同数据

# 品牌-车型-价格范围（单位：万元）
brands = {
    '比亚迪': {'models': ['秦PLUS', '宋PLUS', '汉', '海豚', '海豹', '唐'], 'price_range': (10, 30)},
    '特斯拉': {'models': ['Model 3', 'Model Y', 'Model S'], 'price_range': (25, 60)},
    '大众': {'models': ['朗逸', '帕萨特', '途观', '迈腾', '速腾'], 'price_range': (10, 25)},
    '丰田': {'models': ['卡罗拉', '凯美瑞', 'RAV4', '汉兰达'], 'price_range': (12, 35)},
    '本田': {'models': ['思域', '雅阁', 'CR-V', '飞度'], 'price_range': (10, 25)},
    '宝马': {'models': ['3系', '5系', 'X3', 'X5'], 'price_range': (30, 60)},
    '奔驰': {'models': ['C级', 'E级', 'GLC', 'GLE'], 'price_range': (30, 70)},
    '奥迪': {'models': ['A4L', 'A6L', 'Q5L', 'Q3'], 'price_range': (25, 55)},
    '吉利': {'models': ['帝豪', '博越', '星瑞', '星越L'], 'price_range': (8, 18)},
    '长安': {'models': ['CS75', '逸动', 'UNI-V', 'UNI-K'], 'price_range': (8, 20)},
    '长城': {'models': ['哈弗H6', '坦克300', '炮'], 'price_range': (10, 30)},
    '蔚来': {'models': ['ET5', 'ES6', 'EC6', 'ET7'], 'price_range': (30, 60)},
    '小鹏': {'models': ['P7', 'G6', 'G9'], 'price_range': (20, 40)},
    '理想': {'models': ['L7', 'L8', 'L9'], 'price_range': (30, 50)}
}

# 省份及城市
provinces_cities = {
    '北京': ['北京市'],
    '上海': ['上海市'],
    '广东': ['广州', '深圳', '东莞', '佛山'],
    '浙江': ['杭州', '宁波', '温州'],
    '江苏': ['南京', '苏州', '无锡'],
    '山东': ['济南', '青岛', '烟台'],
    '河南': ['郑州', '洛阳'],
    '四川': ['成都', '绵阳'],
    '湖北': ['武汉', '襄阳'],
    '湖南': ['长沙', '株洲'],
    '福建': ['福州', '厦门'],
    '安徽': ['合肥', '芜湖'],
    '河北': ['石家庄', '唐山'],
    '陕西': ['西安'],
    '重庆': ['重庆市']
}

def gen_dealer(brand, city):
    return f"{city}{brand}4S店"

rows = []
start_date = datetime(2025, 1, 1)
end_date = datetime(2025, 12, 31)
total_days = (end_date - start_date).days

for _ in range(1000):
    # 随机日期（2025年全年）
    days_offset = random.randint(0, total_days)
    date = start_date + timedelta(days=days_offset)
    date_str = date.strftime('%Y-%m-%d')

    brand = random.choice(list(brands.keys()))
    brand_info = brands[brand]
    model = random.choice(brand_info['models'])
    price = round(random.uniform(*brand_info['price_range']), 1)
    quantity = random.randint(1, 10)
    sales_amount = round(price * quantity, 1)

    province = random.choice(list(provinces_cities.keys()))
    city = random.choice(provinces_cities[province])
    dealer = gen_dealer(brand, city)

    rows.append([date_str, brand, model, quantity, price, sales_amount, province, city, dealer])

# 按日期升序排列
rows.sort(key=lambda x: x[0])

# 写入CSV（UTF-8 with BOM，Excel可直接打开）
with open('汽车行业销售情况统计表.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    writer.writerow(['日期', '品牌', '车型', '销售数量', '单价(万元)', '销售额(万元)', '省份', '城市', '经销商'])
    writer.writerows(rows)

print("已生成 汽车行业销售情况统计表.csv，共 1000 条销售记录。")
