export default {
  "app": {
    "title": "Prompt Draft",
    "navigation": {
      "create": "创建",
      "collage": "拼贴",
      "guide": "指南",
      "vectorizer": "矢量化",
      "prompts": "提示词"
    },
    "switchTheme": "切换主题",
    "switchLang": "切换语言",
    "tools": {
      "menu": "更多工具",
      "convert": "转换",
      "about": "关于"
    }
  },
  "pwa": {
    "offline": {
      "prompt": {
        "title": "使用 Prompt Draft 脱机",
        "updateTitle": "更新离线版本",
        "subtitle": "离线软件包",
        "description": "下载所有需要的应用程序文件{size}就是这样 Prompt Draft 网络连接。",
        "updateDescription": "新的离线版本已存在 。{size})下载以保持离线模式的更新。",
        "backgroundHint": "下载在背景中运行, 您可以在程序完成时继续使用 。",
        "action": "下载",
        "updateAction": "更新离线版本",
        "later": "现在不行"
      },
      "status": {
        "downloading": "下载 {progress}%",
        "offlineMode": "你用离线模式。",
        "ready": "准备脱机",
        "failed": "离线下载失败",
        "failedDescription": "无法下载某些文件。 请检查您的连接并重试 。",
        "retry": "再试"
      }
    },
    "install": {
      "android": {
        "title": "安装应用程序",
        "description": "你可以安装 Prompt Draft 在你的设备上,并使用它作为一个常规应用程序。",
        "action": "安装应用程序"
      },
      "ios": {
        "title": "安装于 iOS 设备",
        "description": "要安装在 iPhone 或 iPad 上,请使用浏览器 Share 按钮,并选择将它添加到家屏幕 。",
        "action": "来呀",
        "steps": {
          "share": "1. 启动Safari的控件",
          "addToHomeScreen": "2. 选择 Kate 显示器",
          "confirm": "3. 下个屏幕的录音带。"
        }
      },
      "actions": {
        "close": "关闭"
      }
    }
  },
  "pages": {
    "collage": {
      "panel": {
        "toggle": "切换面板",
        "close": "关闭",
        "dock": "嵌入面板"
      },
      "pip": {
        "select": "选择 PIP",
        "replace": "替换 PIP",
        "remove": "删除 PIP",
        "selected": "PIP: {name}",
        "description": "此单元格的小图像覆盖",
        "position": "PIP 位置",
        "size": "PIP 缩放",
        "positions": {
          "topLeft": "左侧",
          "topCenter": "顶端",
          "topRight": "右侧",
          "centerLeft": "左侧",
          "centerRight": "向右转",
          "bottomLeft": "左侧",
          "bottomCenter": "底端",
          "bottomRight": "右侧"
        },
        "sizes": {
          "small": "小型",
          "medium": "缩写: 缩写",
          "large": "大型"
        }
      },
      "imageFit": {
        "mode": "图像显示模式",
        "cover": "封面",
        "detail": "细节",
        "resetPosition": "重置位置"
      },
      "title": "校正构建器",
      "description": "选择、粘贴或拖动图像并导出画布的最终结果 。",
      "rotateYourPhone": "旋转您的电话",
      "dropzone": {
        "title": "添加图像",
        "description": "单击 / 粘贴 / 拖放"
      },
      "images": {
        "title": "图像",
        "empty": "还没有添加图像 。"
      },
      "brand": {
        "mode": "标记模式",
        "modes": {
          "overlay": "重叠",
          "footer": "页脚"
        },
        "footerAlign": "页脚对齐",
        "footerPadding": "页脚贴纸 : {value}px 数字",
        "footerAligns": {
          "left": "左侧",
          "center": "开",
          "right": "对"
        },
        "panelTitle": "标语",
        "groups": {
          "mode": "模式和位置",
          "text": "文字 :",
          "logo": "密码和 QR"
        },
        "title": "品牌重叠",
        "telegramPostId": "电讯站 ID",
        "telegramPostIdPlaceholder": "(例如:450个)",
        "logoColor": "登录颜色",
        "logoThemes": {
          "white": "白",
          "black": "黑色"
        },
        "position": "品牌位置",
        "positions": {
          "top-left": "左侧",
          "top-center": "顶端",
          "top-right": "右侧",
          "center-left": "左侧",
          "center": "开",
          "center-right": "向右转",
          "bottom-left": "左侧",
          "bottom-center": "底端",
          "bottom-right": "右侧"
        },
        "height": "品牌高度 : {value}px 数字",
        "opacity": "不透明度 : {value}%",
        "gap": "密码和 QR 间距 : {value}px 数字",
        "help": "如果 ID 是空的,只显示徽标。"
      },
      "canvas": {
        "title": "画布",
        "padding": "内侧 : {value}px 数字",
        "gap": "图像间隔 : {value}px 数字",
        "backgroundColor": "背景颜色",
        "exportQuality": "导出质量",
        "decorationsEnabled": "铺设边框( B)",
        "cellRadius": "单元格角半径 : {value}px 数字",
        "outputSize": "输出大小",
        "outputSizes": {
          "small": "小型",
          "medium": "缩写: 缩写",
          "large": "大型"
        }
      },
      "preview": {
        "grid": "网格 : {columns}×{rows}",
        "rendering": "调味料...",
        "videoMeta": "{title} · {width}×{height} · {duration} · {fps}妇女 妇女 {repeat}×{loop}",
        "loopSuffix": " 循环",
        "recordingVideo": "正在录制...",
        "selectedCell": "{name}"
      },
      "actions": {
        "save": "保存",
        "copy": "复制",
        "clear": "清除",
        "remove": "删除",
        "recording": "正在录制...",
        "exportWebm": "导出 WebM",
        "exportingMp4": "导出 MP4...",
        "exportMp4": "导出 MP4",
        "replaceImage": "替换图像",
        "removeImage": "删除图像",
        "refreshPage": "刷新页面"
      },
      "emptyCanvas": {
        "title": "添加图像",
        "description": "在此拖放图像, 从剪贴板粘贴, 或者选择下面的文件 。",
        "pasteHint": "直接粘贴图像 Ctrl/⌘ + V.",
        "action": "添加图像"
      },
      "outputMode": {
        "title": "输出模式",
        "mode": "模式",
        "modes": {
          "image": "图像拼贴",
          "video": "视频幻灯片"
        }
      },
      "textOverlay": {
        "enabled": "文本覆盖",
        "font": "文本字体",
        "text": "重叠文本",
        "placeholder": "例如,将照片变成水彩画风格",
        "size": "文本大小",
        "color": "文本颜色",
        "gap": "文本/ 品牌空白"
      },
      "safeArea": {
        "title": "安全区"
      },
      "video": {
        "title": "视频幻灯片",
        "quality": "MP4 质量",
        "qualityPresets": {
          "compact": "压缩文件",
          "balanced": "结余——建议",
          "high": "高 - 大文件"
        },
        "backgroundMusic": "背景音乐",
        "removeAudio": "删除音频",
        "preset": "预设",
        "presets": {
          "storyReel": "故事/里尔 - 1080x1920",
          "portraitPost": "纵向邮报 - 1080x1350",
          "squarePost": "广场哨所 - 1080x1080",
          "landscape": "环境——1920×1080"
        },
        "width": "宽",
        "height": "高度",
        "calculatedDuration": "计算时间",
        "durationMeta": "{slides} 幻灯片 {transitions} 过渡",
        "loop": "循环",
        "repeat": "再说一遍: {value}×",
        "fps": "FPS: {value}",
        "imageInterval": "图像间隔 : {value}千兆字节",
        "transition": "过渡 : {value}千兆字节",
        "edgeBlur": "边缘模糊 : {value}",
        "randomOrder": "随机顺序",
        "musicVisualizationSoftWave": "启用软波音乐可视化",
        "musicVisualizationHeight": "软波高 : {value}%",
        "randomOrderDisabled": "循环/ 重覆时禁用随机顺序, 这样序列可以保持无缝 。"
      },
      "zoom": {
        "fit": "适合",
        "actual": "实际",
        "panTool": "平面工具"
      },
      "layoutTools": {
        "aspectRatioOrientations": {
          "vertical": "直线",
          "horizontal": "水平"
        },
        "title": "版式工具",
        "shuffleSimilar": "类似图像",
        "shuffleLayout": "乱动布局",
        "constraintMode": "约束模式",
        "constraintModes": {
          "controlled": "控制",
          "free": "免费"
        },
        "canvasRatio": "宽幅比例",
        "canvasRatios": {
          "auto": "自动"
        }
      }
    }
  },
  "modules": {
    "style": {
      "title": "样式",
      "description": "控制瞬间视觉和艺术方向。",
      "groups": {
        "core": {
          "title": "核心样式",
          "description": "主样式身份和显示介质 。"
        },
        "modifiers": {
          "title": "样式修改",
          "description": "精细调整视觉语言和文体化行为。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "附加到生成样式文本的可选额外细节 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的样式输出替换为您的文本 。"
        }
      },
      "fields": {
        "preset": {
          "label": "样式预设",
          "description": "选择主要的艺术风格 。",
          "placeholder": "选择样式预设",
          "options": {
            "3d_cartoon": "3D 卡通",
            "anime_cover": "动画封面",
            "cinematic_realism": "电影现实主义",
            "clay_sculpture": "Clay 雕塑",
            "vinyl_toy": "维尼玩具",
            "angular_animation": "角动画",
            "childlike_drawing": "类似儿童画",
            "cinematic_cgi_character": "电影 CGI 字符",
            "crafted_paper_collage": "手工纸张拼贴",
            "fashion_caricature_sketch": "时装漫画",
            "geometric_editorial": "几何编辑",
            "ink_character_sketch": "墨水字符串",
            "low_poly_3d": "低位 3D",
            "low_poly_character": "低位字符",
            "marker_concept_art": "标记概念艺术",
            "papier_mache_character": "帕皮尔-马歇字符",
            "pixel_art_game_character": "像素艺术游戏字符",
            "plush_toy_character": "附加玩具字符",
            "primitive_cut_paper": "原始剪切纸",
            "retro_comic": "复古",
            "risograph_poster_art": "推论海报艺术",
            "studio_photo_realism": "摄影工作室",
            "watercolor_editorial": "水彩杂志",
            "woodcut_editorial": "木板编辑"
          }
        },
        "medium": {
          "label": "缩写: 缩写",
          "description": "选择基本视觉介质 。",
          "placeholder": "选择介质",
          "categories": {
            "digital_cg": "数字/ CG",
            "drawing": "绘图",
            "painting": "画画",
            "paper_craft": "纸张/工艺品",
            "photography": "拍摄",
            "printmaking": "打印",
            "sculpture_object": "雕刻/ 对象",
            "textile_handmade": "纺织品/手工制作"
          },
          "options": {
            "three_d_render": "3D 调试器",
            "digital_illustration": "数字插图",
            "photo_real": "相片真实",
            "painterly": "绘画",
            "cgi": "CGI",
            "digital_painting": "数字绘画",
            "game_asset_render": "游戏资产发件人",
            "low_poly_render": "低多边向导",
            "pixel_art_digital": "像素艺术数字",
            "vector_illustration": "矢量说明",
            "acrylic_painting": "丙烯漆",
            "ceramic_sculpture": "陶瓷雕塑",
            "charcoal_drawing": "木炭绘图",
            "cinematic_photo": "电影摄影",
            "clay_sculpture": "Clay 雕塑",
            "collectible_figure": "收集图",
            "colored_pencil_drawing": "彩色笔画",
            "etching_print": "打印",
            "fabric_doll": "Fabric 圆环",
            "felt_craft": "felt 手工艺",
            "gouache_painting": "Gouache 绘画",
            "handmade_model": "手工制作模型",
            "ink_and_wash": "墨水和洗涤",
            "ink_drawing": "墨水绘图",
            "linocut_print": "Linocut 打印",
            "macro_photography": "宏摄影",
            "marker_render": "标记显示器",
            "mixed_media_collage": "混合媒体拼贴",
            "oil_painting": "油画",
            "origami_art": "折纸艺术",
            "outdoor_photography": "户外摄影",
            "paper_collage": "纸张拼贴",
            "paper_craft": "纸笔",
            "paper_cutout": "纸张剪切",
            "paper_mache_sculpture": "纸形砍刀雕刻",
            "pastel_drawing": "粘贴绘图",
            "pen_and_ink": "笔墨",
            "pencil_drawing": "笔画",
            "photography": "拍摄",
            "photomontage": "相片配对",
            "plasticine_sculpture": "塑料雕塑",
            "plush_toy": "附加玩具",
            "risograph_print": "递增打印",
            "screen_print": "屏幕打印",
            "stitched_textile_art": "编织纺织品艺术",
            "studio_photography": "摄影室",
            "vinyl_toy_model": "维尼玩具模型",
            "watercolor_painting": "水彩画",
            "woodcut_print": "木剪打印"
          }
        },
        "stylizationLevel": {
          "label": "电流级别",
          "description": "控制风格远离现实",
          "placeholder": "选择星级",
          "options": {
            "subtle": "精细",
            "controlled": "控制",
            "strong": "坚硬的",
            "extreme": "极端",
            "abstract": "缩略语"
          }
        },
        "shapeLanguage": {
          "label": "形状语言",
          "description": "定义主要形式和轮廓行为。",
          "placeholder": "选择形状语言",
          "options": {
            "soft_rounded": "软圆",
            "geometric": "几何",
            "fluid": "流体",
            "blocky": "屏蔽",
            "angular": "边形",
            "elongated": "长"
          }
        },
        "visualTreatment": {
          "label": "视觉治疗",
          "description": "定义图像处理和表面行为。",
          "compatibilityWarnings": {
            "mediumMismatch": "此选项可能不是选中介质的最自然匹配 。"
          },
          "options": {
            "cel_shaded": "塞尔·沙德",
            "flat_graphic": "平面图",
            "halftone_comic": "半调漫画",
            "hand_painted": "画画",
            "ink_watercolor": "彩色颜色( 彩色)",
            "minimalist": "最微缩",
            "paper_cutout": "纸张剪切",
            "textured": "纹理"
          },
          "placeholder": "选择视觉治疗"
        },
        "finish": {
          "label": "结束",
          "description": "确定最后的表面抛光和表面印记",
          "placeholder": "选择完成",
          "compatibilityWarnings": {
            "mediumMismatch": "此选项可能不是选中介质的最自然匹配 。"
          },
          "options": {
            "clean": "开关",
            "premium": "Premium",
            "handcrafted": "手工制作",
            "graphic": "图形",
            "glossy": "光滑",
            "matte": "玛特",
            "rough": "粗略"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选样式细节, 不替换生成的输出 。 @ label",
          "placeholder": "添加额外样式的细节..."
        },
        "customText": {
          "label": "自定义样式",
          "description": "如果填满, 此文本将成为最终样式输出, 其它所有字段将被忽略 。",
          "placeholder": "写入完整的自定义样式描述..."
        }
      },
      "presets": {
        "soft_3d_cartoon": {
          "label": "软 3D 卡通",
          "description": "彩色的3D卡通 面带软圆形的卡通"
        },
        "premium_vinyl_character": {
          "label": "基质",
          "description": "一种可收集的维尼玩具 和奢侈品的粉末。"
        },
        "handmade_clay_artwork": {
          "label": "手工制作",
          "description": "触摸手工艺的粘土雕塑风格"
        },
        "cinematic_realistic_image": {
          "label": "电影现实",
          "description": "一种纯洁的电影现实主义 和微妙的刻板印象。"
        },
        "angular_2d_animation": {
          "label": "角 2D 动画",
          "description": "一个最小的角 2D 动画风格, 带有粗体图形的光影和锐利的几何形式 。"
        },
        "cinematic_cgi_character": {
          "label": "电影 CGI 字符",
          "description": "电影家 CGI 带有软四面形的字符样式, 彩色处理, 和加价抛光完成。"
        },
        "crafted_paper_collage": {
          "label": "手工纸张拼贴",
          "description": "手工艺的纸面拼图 上面有一层层的构造 堵塞的形状 和触觉的结束"
        },
        "geometric_editorial_portrait": {
          "label": "缩写 缩写",
          "description": "粗略的图形化编辑风格"
        },
        "ink_character_sketch": {
          "label": "墨水字符串",
          "description": "彩色的画像 带有有机形态 水彩纹 彩色的彩色"
        },
        "low_poly_character": {
          "label": "低位字符",
          "description": "低质字符风格, 简化几何格式和纯度最小端口"
        },
        "marker_concept_art": {
          "label": "标记概念艺术",
          "description": "标语化的艺术 结构化的形状, 手画的处理, 和干净的视觉结束。"
        },
        "messy_fashion_caricature": {
          "label": "缩写: 缩写: 缩写: 缩写: 缩写: 缩写: 缩写: 缩写: 缩写: 缩写:",
          "description": "一种怪异的时尚漫画风格 夸大了解剖学 墨水颜色处理很乱 讽刺的编辑能量"
        },
        "naive_childlike_artwork": {
          "label": "纯洁的艺术",
          "description": "一个幼稚的艺术风格 简单的形式, 玩耍的不完美, 和手工艺的魅力。"
        },
        "papier_mache_character": {
          "label": "帕皮尔-马歇字符",
          "description": "一个手工制作的papier-mâché 字符样式, 具有角简化形式和触觉艺术结束。"
        },
        "pixel_art_game_character": {
          "label": "像素艺术游戏字符",
          "description": "像素艺术的游戏字符样式, 带有块状简化格式, 强大的刻度, 以及大胆的图形清晰度 。"
        },
        "plush_toy_character": {
          "label": "附加玩具字符",
          "description": "一种柔软四舍五入的玩具风格, 强烈的文体化, 和手工制作的触觉结束。"
        },
        "primitive_cut_paper_portrait": {
          "label": "原始剪贴纸",
          "description": "原始的剪纸肖像风格, 由粗体的多层形状组成, 粗体的刻板块, 粗体的刻面板, 粗体的刻面板。"
        },
        "retro_comic_pop_art": {
          "label": "缩写:",
          "description": "带粗黑面条的复古连环画风格, 图形对比, 和高强度的半音网格。"
        },
        "risograph_poster_art": {
          "label": "推论海报艺术",
          "description": "彩虹海报艺术风格, 结构化, 控制板块, 和粗体图形结束的彩虹。"
        },
        "studio_photo_realism": {
          "label": "摄影工作室",
          "description": "摄影棚里装着微妙的文体 自然的外形 和纯净的外形"
        },
        "watercolor_editorial": {
          "label": "水彩杂志",
          "description": "彩色编辑插图风格, 包括液态有机形式和彩色墨水处理。 彩色"
        },
        "woodcut_editorial": {
          "label": "木板编辑",
          "description": "带有角形图形的木板编辑风格, 强烈的刻度, 以及粗略的打印结束 。"
        }
      }
    },
    "texture": {
      "title": "纹理",
      "description": "控制材料, 表面质量, 和触觉细节。",
      "categories": {
        "vinyl_plastic": "生产、生产、生产、生产、生产",
        "clay_ceramic": "Clay / 陶瓷",
        "metal": "金属",
        "wood": "木头",
        "stone_mineral": "石/ 矿物",
        "glass_crystal": "玻璃/水晶",
        "fabric_textile": "缩写/ 缩写",
        "leather_hide": "盖盖 盖盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖 盖, 盖 盖 盖 盖 盖, 盖 盖 盖 盖 盖 盖 盖 盖, 盖 盖 盖 盖 盖, 盖 盖 盖 盖, 盖 盖 盖 盖 盖, 盖 盖 盖 盖, 盖 盖 盖, 盖 盖, 盖, 盖 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖, 盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖, 盖, 盖, 盖, 盖, 盖,盖, 盖, 盖,盖,盖,盖, 盖,盖, 盖, 盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,盖,",
        "paper_cardboard": "纸张/纸板",
        "rubber": "缩写",
        "organic_natural": "国家/国家/国家/国家/国家/国家/国家/国家/国家/国家"
      },
      "warnings": {
        "surface_smooth": "这个表面通常更适合使用清洁、擦拭或制造的材料。",
        "surface_matte": "毛特表面通常使用纸张、布料、粘土、木材、橡胶或非反光材料最有效。",
        "surface_glossy": "光滑的表面对织物或高孔材料来说不那么自然,除非它们被涂、层化或处理。",
        "surface_high_gloss": "玻璃、金属、陶瓷、树脂或涂层塑料一般都比高光镜般的完成量好。",
        "surface_brushed": "磨损的表面质地最适合金属,而且只有有时才适用于木材或处理过的塑料。",
        "surface_rough": "粗糙的触觉表面通常对木材、石块、粘土、纸张或天然纹理材料效果更好。",
        "surface_porous": "彩虹表面通常不适合彩虹表面。",
        "surface_grainy": "精细的谷物通常对木质、粘土、石质、纸质或有机材料有更好的作用。",
        "surface_fibrous": "纤维质地对于纤维、纸张、木料或有机材料来说比较自然。",
        "surface_woven": "Woven 纹理大多适用于Telef 或Telef Tripple材料。",
        "surface_translucent": "彩色表面通常适合玻璃、水晶、树脂、蜡或一些塑料。",
        "surface_frosted": "冷冻的表面对玻璃、水晶、树脂或处理过的塑料最有效。",
        "detail_intricate": "精细的精细通常不适于非常软或橡胶类的材料。",
        "detail_coarse": "粗体质料通常不太适合玻璃、水晶、丝绸、天鹅绒或高压材料。",
        "imperfection_grain": "毛巾、粘土、石头、纸张或多孔的有机材料通常使用得更好。",
        "imperfection_brush_marks": "油漆、手工制作、纸张、木材、粘土或陶瓷表面的刷子通常更有意义。",
        "imperfection_paint_splatter": "油漆喷洒通常对油漆、纸张、帆布、木材、塑料、树脂或玩具类材料效果更好。",
        "imperfection_scratches": "石斑通常在金属、塑料、玻璃、木料或皮革等硬材料上更为清晰。",
        "imperfection_cracks": "在粘土、陶瓷、石头、木材、油漆、玻璃或易碎材料上,裂缝通常更自然。",
        "imperfection_dents": "牙科通常对金属、塑料、橡胶、皮革、粘土或弹性材料有更好的作用。",
        "imperfection_chips": "尖锐的边缘通常对硬质或易碎的材料更有用。",
        "imperfection_stains": "织物、纸张、木材、皮革、石头、粘土、陶瓷或多孔材料通常更自然。",
        "imperfection_roughness": "粗略的不均衡质地通常不适合玻璃、水晶、丝绸、天鹅绒或非常光滑的材料。",
        "imperfection_fading": "涂料、纸张、皮革、木材、塑料或油漆材料的涂料颜色通常效果更好。",
        "imperfection_wrinkles": "皱纹和折痕通常适用于布料、皮革、纸张、橡胶或弹性材料。",
        "imperfection_peeling": "磨损或抛光在涂料、涂层、磨损或层层表面上最有效。",
        "imperfection_corrosion": "高压电压和高压电压"
      },
      "groups": {
        "material": {
          "title": "数字",
          "description": "确定主要的物质特性。"
        },
        "surface": {
          "title": "表面质量",
          "description": "控制表面的完成和质地的精度。"
        },
        "advanced": {
          "title": "高级纹理细节",
          "description": "添加可选的不完善和额外的纹理描述 。"
        }
      },
      "fields": {
        "material": {
          "label": "数字",
          "description": "选择基本物质类型 。",
          "placeholder": "选择材料",
          "options": {
            "vinyl": "维基",
            "clay": "缩写: Clay",
            "plastic": "塑料类",
            "metal": "金属",
            "fabric": "费布里克",
            "acrylic_plastic": "丙烯酸塑料",
            "molded_plastic": "混凝土塑料",
            "pvc": "PVC",
            "resin": "静态",
            "silicone": "硅",
            "aluminum": "铝",
            "bamboo": "竹头",
            "birch": "布尔奇语Name",
            "bone": "骨头",
            "brass": "铜",
            "bronze": "铜",
            "canvas": "画布",
            "cardboard": "纸板",
            "cedar": "锡达",
            "chrome": "铬",
            "concrete": "土 石 石 石",
            "copper": "铜",
            "coral": "缩写:",
            "cotton": "缩写:CATL 缩写:",
            "crystal": "水晶",
            "denim": "内 容 提 要",
            "earthenware": "地球软件",
            "faux_leather": "Faux 皮革",
            "felt": "感觉",
            "frosted_glass": "冷冻玻璃",
            "glass": "玻璃",
            "gold": "黄金",
            "granite": "花岗岩",
            "iron": "铁",
            "ivory": "象牙",
            "kraft_paper": "纸",
            "lace": "蕾丝",
            "latex": "拉图",
            "leather": "皮革",
            "limestone": "石灰石",
            "linen": "单词",
            "mahogany": "红木",
            "maple": "地图",
            "marble": "大理石",
            "neoprene": "新苯",
            "oak": "橡树",
            "paper": "纸张",
            "parchment": "纸牌",
            "pine": "松树",
            "plush": "附加",
            "porcelain": "瓷器",
            "quartz": "夸尔茨",
            "rubber": "缩写",
            "sandstone": "沙石",
            "shell": "贝壳",
            "silk": "丝绸",
            "silver": "银",
            "slate": "定点",
            "stained_glass": "染色玻璃",
            "stainless_steel": "无锈钢",
            "steel": "钢",
            "stoneware": "石器",
            "suede": "苏德",
            "terracotta": "纽约",
            "titanium": "Titanium",
            "velvet": "天鹅",
            "walnut": "胡桃",
            "wax": "韦克斯",
            "wool": "乌鸦"
          }
        },
        "surface": {
          "label": "表面图",
          "description": "选择表面结束 。",
          "placeholder": "选择表面结束",
          "options": {
            "smooth": "开关",
            "matte": "玛特",
            "glossy": "光滑",
            "porous": "乌鸦",
            "brushed": "脸红",
            "fibrous": "乌鸦毛",
            "frosted": "结晶",
            "grainy": "Grainy",
            "high_gloss": "高光",
            "rough": "粗略",
            "translucent": "半透明",
            "woven": "编织"
          }
        },
        "detailLevel": {
          "label": "详细职等",
          "description": "控制多少表面细节是可见的。",
          "placeholder": "选择细节级别",
          "options": {
            "minimal": "最小端",
            "subtle": "精细",
            "visible": "可见",
            "rich": "富人数",
            "coarse": "粗鲁",
            "highly_detailed": "高度详细",
            "intricate": "插入"
          }
        },
        "imperfections": {
          "label": "不完善",
          "description": "添加现实或标准表面不完善之处。",
          "placeholder": "选择不完善",
          "options": {
            "clean": "开关",
            "handmade": "手工制作的不完美",
            "grain": "细粒子",
            "brush_marks": "刷子",
            "paint_splatter": "画彩",
            "chips": "芯片",
            "corrosion": "腐蚀",
            "cracks": "裂纹",
            "dents": "牙科",
            "dust": "尘土",
            "fading": "渐渐",
            "peeling": "切换",
            "roughness": "粗糙",
            "scratches": "缩略图",
            "stains": "缩写",
            "weathered": "天气",
            "wrinkles": "滑动"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选纹理细节, 不替换生成的输出 。",
          "placeholder": "添加额外的纹理细节..."
        },
        "customText": {
          "label": "自定义纹理",
          "description": "如果填满,此文本将成为最终纹理输出,而所有其他字段则被忽略。",
          "placeholder": "写入完整的自定义纹理描述..."
        }
      },
      "presets": {
        "smooth_vinyl": {
          "label": "平滑的维尼",
          "description": "一个干净的光滑 类似材料设置。"
        },
        "handmade_clay": {
          "label": "手工制作",
          "description": "触摸式手工粘土表面 带有微妙的不完善之处"
        },
        "polished_metal": {
          "label": "波兰金属",
          "description": "彩色的金属材料"
        },
        "painterly_surface": {
          "label": "画画表",
          "description": "毛线板化的表面 上面有刷子和油漆"
        }
      }
    },
    "deformation": {
      "title": "变形",
      "description": "控制这个主题如何被扭曲, 夸大,或转变。",
      "groups": {
        "core": {
          "title": "变形",
          "description": "选择 缩放 缩放"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外变形细节, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的变形输出替换为 Kate 。"
        }
      },
      "fields": {
        "deformationStyle": {
          "label": "变形样式",
          "description": "从分类列表中选择所需的变形样式。",
          "placeholder": "选择变形样式",
          "categories": {
            "brutalist": "布鲁塔利",
            "caricature": "圆形",
            "compressed": "压缩",
            "cute_chibi": "可爱/ 奇比",
            "elastic": "弹性",
            "extreme_stylized": "极端/固定",
            "fashion_editorial": "时装/编辑",
            "geometric": "几何",
            "grotesque": "格罗特克",
            "inflated": "充气",
            "insectoid_creature": "昆虫/生物",
            "liquid": "液体",
            "material_driven": "材料驱动",
            "minimal": "最小端",
            "motion_driven": "驱动",
            "organic": "简称表",
            "paper_cutout": "纸张剪切",
            "puppet_doll": "木偶/ 玩偶",
            "sculptural": "雕塑",
            "surreal": "超真实"
          },
          "options": {
            "abstract_human_hybrid": "人类混合摘要",
            "abstract_statue_deformation": "抽象雕像",
            "absurd_misshapen_anatomy": "荒谬的Misshapen解剖学",
            "action_arc_distortion": "动作弧扭曲",
            "alien_elongated_structure": "外星结构",
            "angular_faceted_anatomy": "角形解剖",
            "asymmetric_natural_growth": "自然增长不均",
            "asymmetrical_body_imbalance": "身体不对称",
            "avant_garde_pose_distortion": "Avant 加德·波斯扭曲",
            "awkward_personality_distortion": "令人尴尬的人格扭曲",
            "baby_like_proportion_shift": "婴儿比例变化",
            "balloon_like_anatomy": "气球如解剖",
            "chiseled_stone_like_planes": "摇摇晃晃的石像飞机",
            "clay_built_body_distortion": "Clay 造体扭曲",
            "comedic_face_heavy_exaggeration": "喜剧脸部严重夸张",
            "compact_toy_cuteness": "压缩玩具可爱",
            "creature_hybrid_distortion": "生物混合",
            "cuboid_block_deformation": "Cuboid 块变形",
            "distorted_elegance": "扭曲的优雅",
            "dramatic_silhouette_exaggeration": "戏剧性静光片夸张",
            "dreamlike_proportion_shift": "梦想式的转变",
            "exoskeleton_body_logic": "外骨骼体逻辑",
            "experimental_art_deformation": "实验艺术变形",
            "extreme_limb_flexibility": "极轻度",
            "fabric_fold_deformation": "Fabric 格式变形",
            "fashion_caricature_distortion": "时装化扭曲",
            "flat_graphic_figure": "平面图",
            "flattened_body_distortion": "火化体扭曲",
            "floating_inflated_figure": "浮动缩放图",
            "fluid_smear_transformation": "流体闪烁",
            "fractured_plane_structure": "断裂的平板结构",
            "full_abstraction_distortion": "完全抽象扭曲",
            "gentle_posture_redesign": "轻柔的态势重新设计",
            "gravity_defying_figure": "重力防守图",
            "grotesque_humorous_exaggeration": "Grotesque 幽默夸张",
            "harsh_angular_compression": "边缘压缩",
            "heavy_block_anatomy": "重块解剖",
            "heavy_downward_compression": "向下压缩",
            "impact_squash_and_stretch": "冲击平方和伸展",
            "impossible_body_geometry": "无法体形测量",
            "insectoid_segmented_anatomy": "昆虫分割解剖",
            "latex_stretch_distortion": "Latex 伸展扭曲",
            "layered_paper_body": "层纸体",
            "liquid_stretch_distortion": "液体伸展",
            "low_intensity_proportion_shift": "低强度比例移位",
            "luxury_sculptural_body": "豪华雕塑机构",
            "mannequin_body_structure": "曼纳金身体结构",
            "marionette_jointed_body": "马里昂内特联合体",
            "melting_body_collapse": "熔化体折叠",
            "miniature_handmade_model": "小型手工制作模型",
            "monumental_rough_figure": "纪念物粗略图",
            "oversized_head_tiny_body": "超大头部",
            "overstuffed_soft_proportions": "超载软比例",
            "porcelain_doll_proportions": "陶瓷娃娃比例",
            "primitive_block_distortion": "原始区块扭曲",
            "puppet_cutout_pose": "木偶切除套件",
            "radical_silhouette_transformation": "激进轮廓变形",
            "restrained_facial_stylization": "弹性面板化",
            "root_like_body_flow": "根像身体流",
            "rubber_hose_body_stretch": "橡胶软体伸展",
            "runway_elongation": "跑道延长",
            "soft_bendable_figure": "软弯图",
            "soft_biomorphic_distortion": "软生物形态扭曲",
            "soft_rounded_mascot_body": "柔软圆形马斯科体",
            "soft_warped_anatomy": "软扭曲解剖",
            "speed_smear_body": "速度闪光体",
            "spring_loaded_anatomy": "弹簧解剖",
            "squashed_compact_anatomy": "粉碎的契约",
            "squeezed_facial_features": "挤压面部特征",
            "strange_theatrical_distortion": "奇怪的戏剧扭曲",
            "subtle_body_elongation": "隐形体长",
            "swollen_facial_structure": "肿胀的面部结构",
            "torn_collage_distortion": "撕裂拼凑",
            "triangular_silhouette_distortion": "三角圆形圆形",
            "twisted_organic_anatomy": "扭曲的有机解剖",
            "warped_wood_volume": "扭曲的木体",
            "wax_droop_distortion": "Wax Droop 扭曲",
            "wild_expressive_anatomy": "狂野表达解剖",
            "wind_pulled_anatomy": "风拉动解剖",
            "wooden_doll_distortion": "木偶扭曲"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外变形细节, 不替换生成的输出 。",
          "placeholder": "添加额外的变形细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您自己的变形文本并替换生成的输出 。",
          "placeholder": "写入您的自定义变形文本..."
        }
      }
    },
    "background": {
      "title": "背景情况",
      "description": "控制对象背后的视觉设置或背景。",
      "groups": {
        "core": {
          "title": "背景情况",
          "description": "选择精确的背景样式 。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外背景细节, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的背景输出替换为您自己的文本 。"
        }
      },
      "fields": {
        "backgroundStyle": {
          "label": "背景样式",
          "description": "从分类列表中选择所需的背景样式。",
          "placeholder": "选择背景样式",
          "categories": {
            "abstract": "缩略语",
            "cinematic": "电影",
            "clean_minimal": "清洁/ 最小端",
            "collage_mixed_media": "拼贴/混合介质",
            "depth_blurred": "深度/ 模糊度",
            "dynamic_action": "动态/ 动作",
            "environmental": "环境",
            "fantasy_surreal": "幻想/超现实",
            "graphic_poster": "图形/ 海报",
            "luxury_premium": "奢侈/优待",
            "nature": "自然",
            "pattern": "图案",
            "sci_fi_futuristic": "科学- Fi/ 未来",
            "sports_stadium": "体育/体育馆",
            "studio": "工作室",
            "texture_material": "纹理/材料",
            "thematic": "主题:",
            "transparent_cutout": "透明/ 关闭",
            "urban": "城市 地区",
            "vintage_retro": "原形/ 复古"
          },
          "options": {
            "action_field_setting": "动作字段设置",
            "airy_white_space_composition": "空气白色空间构成",
            "analog_film_era_backdrop": "模拟电影 Era 后传",
            "arena_crowd_atmosphere": "Arena 人群大气",
            "atmospheric_haze_scene": "大气烟雾",
            "bold_poster_composition": "粗体海报构成",
            "classic_studio_paper_backdrop": "经典工作室纸张回放",
            "coastal_or_waterside_scene": "海岸或水边景象",
            "color_field_abstraction": "颜色字段抽象",
            "commercial_product_studio": "商业产品演播室",
            "concrete_or_stone_surface": "混凝土或石头表面",
            "cyber_inspired_setting": "网络启发设置",
            "dramatic_dark_studio": "戏剧性黑暗工作室",
            "dramatic_storytelling_backdrop": "戏剧性叙事回滴",
            "dreamlike_fantasy_environment": "梦幻般的环境",
            "editorial_graphic_layout": "编辑图形布局",
            "elegant_premium_setting": "高档价位设置",
            "enchanted_world_backdrop": "被启发的世界",
            "everyday_indoor_environment": "每天室内环境",
            "expressive_abstract_energy": "表达式摘要能源",
            "fabric_or_soft_material_backdrop": "Fabric 或软材料回调",
            "fluid_abstract_forms": "流体摘要表",
            "forest_or_woodland_setting": "森林或林地",
            "futuristic_architectural_space": "未来建筑空间",
            "geometric_abstract_structure": "几何抽象结构",
            "holographic_tech_environment": "全息技术环境",
            "industrial_urban_texture": "工业城市结构",
            "lush_natural_landscape": "拉什自然景观",
            "luxury_interior_ambiance": "豪华内衣",
            "metal_or_industrial_material": "金属或工业材料",
            "modern_city_backdrop": "现代城市回落",
            "moody_cinematic_depth": "Moody 电影深度",
            "neon_lit_urban_night": "尼昂利特城市之夜",
            "night_scene_cinematic_setting": "夜景电影制作",
            "nostalgic_retro_setting": "怀旧后台设置",
            "open_sky_and_horizon": "开放天空和地平线",
            "opulent_dramatic_backdrop": "极光回放",
            "paper_or_handmade_texture": "纸质或手制质地",
            "plain_seamless_backdrop": "无缝回放",
            "polished_brand_aesthetic": "波兰品牌美学",
            "premium_portrait_studio": "彩虹画室",
            "promotional_campaign_backdrop": "支持运动",
            "public_place_atmosphere": "公共场所大气",
            "realistic_outdoor_setting": "现实外出设置",
            "retro_graphic_environment": "反向图形环境",
            "soft_neutral_background": "软中性背景",
            "space_age_minimal_future": "空间时代最小未来",
            "stadium_spotlight_environment": "电磁极环境",
            "street_level_urban_scene": "街道级城市",
            "subtle_tonal_gradient": "精细音量梯度",
            "surreal_spatial_distortion": "超现实空间扭曲",
            "symbolic_surreal_scene": "符号超真实场景",
            "thumbnail_friendly_graphic_scene": "缩略图友好图形场景",
            "training_or_performance_backdrop": "训练或性能",
            "work_or_lifestyle_environment": "工作或生活方式环境",
            "worn_old_world_ambiance": "旧世界",
            "asset_ready_transparent_space": "资产准备透明空间",
            "branded_motif_repetition": "标名 Motif 重复",
            "cinematic_defocused_backdrop": "缩放",
            "clean_sticker_style_isolation": "清洁粘贴样式",
            "creamy_bokeh_atmosphere": "BOKE 大气",
            "distant_environmental_blur": "远端环境模糊",
            "explosion_of_visual_energy": "视觉能源爆炸",
            "fashion_themed_setting": "时装设计",
            "high_intensity_action_backdrop": "高强度动作",
            "isolated_subject_extraction": "独立标的",
            "minimal_micro_pattern_texture": "最小微图案",
            "mixed_media_art_backdrop": "混合媒体艺术回放",
            "music_themed_environment": "音乐热门环境",
            "organic_decorative_pattern": "有机装饰型式",
            "paper_collage_composition": "纸张拼贴",
            "poster_collage_energy": "海报拼凑能源",
            "pure_transparent_cutout": "纯透明",
            "repeating_geometric_pattern": "重复几何模式",
            "scrapbook_style_arrangement": "剪贴簿样式安排",
            "shallow_depth_portrait_blur": "浅深直径",
            "speed_line_action_field": "速度行动作字段",
            "sports_themed_context": "体育主题",
            "technology_themed_scene": "技术",
            "wind_and_motion_atmosphere": "风与运动"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外背景细节, 不替换生成的输出 。",
          "placeholder": "添加额外背景信息..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您自己的背景描述, 并替换生成的输出 。",
          "placeholder": "写入您的自定义背景文字..."
        }
      }
    },
    "lighting": {
      "title": "照明",
      "description": "控制现场的照明设置或照明情绪。",
      "groups": {
        "core": {
          "title": "照明",
          "description": "选择确切的照明风格 。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外照明细节, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的照明输出替换为您的文本 。"
        }
      },
      "fields": {
        "lightingStyle": {
          "label": "灯光样式",
          "description": "从分类列表中选择想要的照明样式 。",
          "placeholder": "选择一个照明样式",
          "categories": {
            "atmospheric": "空气中",
            "cinematic": "电影",
            "color_mood": "颜色/ 调色器",
            "hard_graphic": "硬/ 图形",
            "practical_environmental": "实际/环境",
            "soft_natural": "软/ 自然",
            "studio": "工作室",
            "stylized_artistic": "立体/艺术",
            "subject_separation": "离职"
          },
          "options": {
            "anime_style_dramatic_lighting": "动画样式",
            "background_separation_light": "背景分离灯",
            "backlit_silhouette": "闪光灯",
            "beauty_lighting": "美发",
            "bloom_heavy_glow": "闪耀重光",
            "candlelight_glow": "蜡烛闪光",
            "chiaroscuro_lighting": "奇亚罗斯库罗灯光",
            "claymation_lighting": "电动照明",
            "clean_studio_lighting": "清洁工作室照明",
            "comic_book_lighting": "漫画",
            "cool_blue_mood_light": "凉爽的蓝色木偶灯",
            "cool_natural_light": "凉爽的自然光",
            "dramatic_cinematic_lighting": "戏剧性电影照明",
            "dual_tone_lighting": "双色调照明",
            "dusty_light_rays": "达斯丁光雷",
            "edge_highlight": "边缘突出显示",
            "film_noir_lighting": "电影Noir 照明",
            "firelight": "灯光",
            "fluorescent_indoor_light": "室内荧光",
            "gentle_ambient_light": "温柔的周围光",
            "golden_hour_cinematic_light": "金色时光",
            "halo_backlight": "光环背光",
            "hard_direct_light": "硬直线",
            "harsh_flash_lighting": "闪光灯",
            "hazy_volumetric_light": "薄荷量光",
            "high_contrast_graphic_lighting": "高对比度图形照明",
            "high_key_studio_lighting": "高密钥工作室照明",
            "iridescent_lighting": "月光灯",
            "low_key_studio_lighting": "低键工作室照明",
            "misty_soft_glow": "雾软光",
            "monochromatic_lighting": "单色照明",
            "moody_side_lighting": "穆迪边灯",
            "natural_window_light": "自然窗口",
            "neon_color_lighting": "亮光",
            "overcast_daylight": "覆盖日光",
            "painterly_lighting": "绘画",
            "pastel_lighting": "粘贴照明",
            "rainy_reflective_lighting": "雨反射",
            "rim_light": "闪光",
            "rim_lit_studio_setup": "Rim Lit 工作室设置",
            "screen_light": "屏幕光",
            "silhouette_emphasis": "缩影",
            "smoky_stage_light": "烟雾般的光",
            "soft_diffused_light": "软滑光",
            "softbox_lighting": "软箱照明",
            "spotlight_lighting": "点灯",
            "stage_lighting": "舞台照明",
            "streetlight_illumination": "电灯",
            "strong_shadow_pattern": "强烈的阴影",
            "subject_focused_light": "主题光",
            "surreal_dream_lighting": "超真实的光芒",
            "top_hard_light": "最硬的光",
            "toy_render_lighting": "玩具设计",
            "underlighting": "Underlighting",
            "warm_cinematic_glow": "热电影",
            "warm_natural_light": "温暖的自然光"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外照明细节, 不替换生成的输出 。",
          "placeholder": "添加额外照明信息..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您的照明文字并替换生成的输出 。",
          "placeholder": "写您自定义的照明文字..."
        }
      }
    },
    "framing": {
      "title": "妇女发展",
      "description": "控制拍摄大小、对象位置、摄像角度、成分、作物规则和布局意图。",
      "groups": {
        "core": {
          "title": "妇女发展",
          "description": "选择精确的设置和组成样式 。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外框架细节, 而不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的框架输出替换为您自己的文本 。"
        }
      },
      "fields": {
        "framingStyle": {
          "label": "设置样式",
          "description": "从分类列表中选择所需的框架样式。",
          "placeholder": "选择框架样式",
          "categories": {
            "camera_distance_lens_feel": "相机距离/ 镜头感觉",
            "composition_style": "配置样式",
            "cropping_rules": "裁剪规则",
            "format_layout_intent": "格式/布局意图",
            "perspective_angle": "角度/角度",
            "shot_size_crop": "射击大小/裁剪",
            "subject_placement": "对象定位"
          },
          "options": {
            "asset_safe_margin": "资产安全边缘",
            "asymmetrical_composition": "构成不对称",
            "birds_eye_view": "鸟眼视图",
            "bust_shot": "中弹",
            "centered_composition": "核心构成",
            "cinematic_composition": "电影业",
            "cinematic_widescreen_framing": "电影版宽屏",
            "close_up": "关闭",
            "distant_observational_frame": "远端观测框架",
            "dramatic_wide_angle_frame": "戏剧宽角框架",
            "dynamic_diagonal_composition": "动态对角构成",
            "edge_weighted_composition": "边边",
            "editorial_composition": "编辑组成",
            "extreme_close_up": "极端接近",
            "eye_level_angle": "眼睛水平角",
            "face_safe_crop": "脸安全裁剪",
            "frontal_view": "前视图",
            "full_body": "满体",
            "graphic_composition": "图形构成",
            "hands_safe_crop": "手安全裁剪",
            "head_and_shoulders": "头和肩",
            "high_angle_view": "高角度视图",
            "intimate_portrait_distance": "近距离",
            "isolated_subject_composition": "单独主题构成",
            "layered_depth_composition": "层深度构成",
            "low_angle_view": "低角度视图",
            "lower_frame_placement": "下框架位置",
            "medium_shot": "中射击",
            "natural_portrait_distance": "自然纵向距离",
            "negative_space_composition": "负空间构成",
            "no_crop_safe_frame": "无作物安全框架",
            "off_center_composition": "中心构成",
            "poster_framing": "海报",
            "poster_safe_composition": "海报-安全构成",
            "product_style_framing": "产品样式",
            "profile_view": "配置视图",
            "rule_of_thirds_placement": "第三安置规则",
            "silhouette_safe_crop": "锡尔胡特-安全作物",
            "social_portrait_framing": "社会肖像",
            "square_icon_framing": "平方图标",
            "symmetrical_composition": "对称构成",
            "telephoto_compressed_frame": "远程光谱压缩框架",
            "three_quarter_angle": "三季度角",
            "three_quarter_shot": "3季度射击",
            "thumbnail_framing": "缩略图",
            "tight_intentional_crop": "严格有意裁剪",
            "top_down_view": "上下视图",
            "upper_frame_placement": "上框架位置",
            "wide_angle_environmental_frame": "宽角环境框架",
            "wide_full_body_frame": "宽体框架",
            "worms_eye_view": "虫子眼视图"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外框架细节, 而不替换生成的输出 。",
          "placeholder": "添加额外框架细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入自己的框架说明, 并替换所生成的输出 。",
          "placeholder": "写下自定义框架文字"
        }
      }
    },
    "pose": {
      "title": "Pose",
      "description": "控制主体的身体姿势、姿态和在现场的动态或静态定位。",
      "groups": {
        "core": {
          "title": "Pose",
          "description": "选择对象的确切姿势和身体定位 。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外显示说明, 但不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的图像输出替换为您自己的文本 。"
        }
      },
      "fields": {
        "poseStyle": {
          "label": "Pose 样式",
          "description": "从分类列表中选择想要的配置样式 。",
          "placeholder": "选择摆放样式",
          "categories": {
            "character_emotional": "字符/ 情感",
            "dynamic_action": "动态/ 动作",
            "editorial_fashion": "编辑/时装",
            "gesture_hand_based": "手持设备( K)",
            "interaction_object": "互动/ 对象",
            "neutral_basic": "中性/ 基本",
            "seated_resting": "座/休息",
            "sports_athletic": "体育/体育"
          },
          "options": {
            "action_ready_stance": "行动- 准备 Stance",
            "arms_crossed_pose": "横穿武器",
            "athlete_ready_stance": "艺术- 重建 Stance",
            "awkward_off_balance_pose": "Awkward Off Balance Pose",
            "casual_weight_shift_pose": "随机体重移动",
            "celebration_pose": "庆祝",
            "confident_upright_pose": "自信 直立",
            "contemplative_pose": "Contemplative Pose",
            "crouching_pose": "缩写",
            "dramatic_asymmetrical_fashion_pose": "戏剧性不对称",
            "elongated_elegant_pose": "高高的盖子",
            "expressive_hand_pose": "手脚",
            "fashion_editorial_stance": "时装编辑风格",
            "hand_on_hip_pose": "掌声收看",
            "hands_at_sides_pose": "手放在侧面",
            "hands_in_pockets_pose": "手放在垫子上",
            "heroic_pose": "希罗克波斯",
            "holding_object_pose": "持有对象波斯",
            "interacting_with_environment_pose": "与环境波斯互动",
            "jumping_pose": "跳跃",
            "kneeling_pose": "跪下 脚踏实地",
            "leaning_on_surface_pose": "倾斜于表面",
            "leaning_seated_pose": "倾斜系印花",
            "looking_at_object_pose": "查看对象套件",
            "mid_performance_pose": "中等性能",
            "mysterious_guarded_pose": "神秘的卫兵波斯",
            "open_arm_welcoming_pose": "开臂欢迎波斯",
            "over_the_shoulder_pose": "超长的波斯",
            "phone_or_device_interaction_pose": "电话或设备交互波",
            "playful_character_pose": "游戏字符波",
            "playful_hand_gesture_pose": "滑稽手势",
            "pointing_gesture_pose": "指针手势",
            "power_stance_pose": "电源螺旋",
            "presenting_object_pose": "显示对象套接",
            "reaching_pose": "达到波斯",
            "reclining_pose": "仰卧",
            "relaxed_seated_pose": "放松的西装",
            "relaxed_standing_pose": "轻松的站立",
            "running_action_pose": "运行动作",
            "runway_inspired_pose": "跑道 灵感波斯",
            "seated_upright_pose": "贴上印章",
            "shy_inward_pose": "害羞的内裤",
            "sport_specific_action_pose": "体育具体行动",
            "standing_neutral_pose": "站立中立波斯",
            "symmetrical_formal_pose": "对称正弦",
            "training_action_pose": "培训行动",
            "turning_in_motion_pose": "转动动作",
            "walking_motion_pose": "漫步运动"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外显示说明, 但不替换生成的输出 。",
          "placeholder": "添加额外设置细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您自己的摆设说明, 并替换生成的输出 。",
          "placeholder": "写您自定义的姿势..."
        }
      }
    },
    "expression": {
      "title": "表达式",
      "description": "控制对象的面部表情、情绪和总体面部情绪。",
      "groups": {
        "core": {
          "title": "表达式",
          "description": "选择准确的面部表情 和情绪型态"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外表达式说明, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的表达式输出替换为您的文本 。"
        }
      },
      "fields": {
        "expressionStyle": {
          "label": "表达式",
          "description": "从分类列表中选择想要的表达式样式 。",
          "placeholder": "选择表达式",
          "categories": {
            "angry_aggressive": "愤怒/ 侵略",
            "comic_grotesque": "缩写/ 缩写",
            "cute_chibi": "可爱/ 奇比",
            "dramatic_serious": "戏剧/ 严重",
            "editorial_fashion": "编辑/时装",
            "fantasy_creature": "Fantasy/ 生物",
            "neutral_controlled": "中立/ 控制",
            "positive_friendly": "目标 目标 目标",
            "sad_vulnerable": "悲伤/ 脆弱",
            "surprised_shocked": "惊吓/惊吓"
          },
          "options": {
            "absurd_caricature_expression": "缩放图像",
            "adorable_happy_face": "可爱的笑脸",
            "aggressive_confrontational_face": "攻击性对抗",
            "alien_unreadable_face": "异形无法读取的面孔",
            "aloof_fashion_expression": "缩放时尚表达式",
            "ancient_wise_expression": "古智慧表达式",
            "angry_intense_expression": "愤怒表达式",
            "awkward_humorous_expression": "缩写 缩写",
            "battle_ready_expression": "战斗准备表达式",
            "cheerful_approachable_expression": "欢快可接近表达式",
            "comic_disbelief_expression": "缩略语 缩略语",
            "confident_editorial_stare": "稳健编辑",
            "confident_smile": "自信的笑容",
            "confused_startled_expression": "无法打开的表达式",
            "controlled_professional_expression": "受控专业表达式",
            "cool_detached_gaze": "凉爽的盖兹",
            "curious_nonhuman_expression": "好奇的非人类表达",
            "cute_excited_expression": "可爱的兴奋表达式",
            "distorted_theatrical_expression": "扭曲的戏剧表达式",
            "dramatic_cinematic_gaze": "戏剧性胶片泡沫",
            "dramatic_gasp_expression": "戏剧 Gasp 表达式",
            "dramatic_model_face": "戏剧模型面孔",
            "elegant_subtle_expression": "优雅的精细表达式",
            "exaggerated_goofy_face": "夸大了的高菲脸",
            "focused_determined_expression": "聚焦确定表达式",
            "furious_shouting_expression": "愤怒的呐喊表达式",
            "gentle_smile": "轻轻的笑容",
            "gritted_teeth_expression": "刻度齿轮表达式",
            "grotesque_comic_grin": "Grotesque 漫画",
            "heartbroken_expression": "心碎表达式",
            "innocent_wide_eyed_expression": "无辜的宽眼表达式",
            "intense_serious_stare": "严重磨损",
            "joyful_expression": "欢乐表达式",
            "lonely_distant_gaze": "孤独的远处盖兹",
            "luxury_calm_expression": "豪华平静表达式",
            "magical_calm_expression": "神奇的平静表达式",
            "mascot_friendly_expression": "Mascot 友好表达式",
            "melancholic_serious_face": "忧郁症",
            "minimal_emotional_expression": "最小情感表达式",
            "mysterious_creature_gaze": "神秘的怪兽",
            "mysterious_restrained_expression": "神秘化限制表达式",
            "neutral_calm_expression": "中性平静表达式",
            "outraged_protest_expression": "抗议活动",
            "overwhelmed_reaction_face": "高压反应",
            "playful_smile": "玩乐笑",
            "predatory_focused_expression": "专注表达式",
            "quiet_melancholic_expression": "静静的忧郁表达式",
            "relaxed_subtle_expression": "轻松精华表达式",
            "sad_emotional_expression": "悲伤情绪",
            "satirical_smug_expression": "直观表达式",
            "serious_neutral_face": "严肃的中立",
            "shocked_exaggerated_face": "惊吓的夸夸其谈",
            "soft_natural_expression": "软自然表达式",
            "soft_sleepy_expression": "软沉睡表达式",
            "stern_powerful_expression": "斯特恩语法",
            "surprised_wide_eyed_expression": "令人惊讶的宽眼表达式",
            "tearful_emotional_face": "悲伤的情绪",
            "tiny_shy_smile": "轻柔的微笑",
            "vulnerable_soft_expression": "脆弱软表达式",
            "warm_friendly_smile": "温暖的笑容"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外表达式说明, 不替换生成的输出 。",
          "placeholder": "添加额外表达式细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您的表达式说明, 并替换生成的输出 。",
          "placeholder": "写入您的自定义表达式文本..."
        }
      }
    },
    "outfit": {
      "title": "设计",
      "description": "控制对象的服装、服装和服装风格,无论年龄或种类如何。",
      "groups": {
        "core": {
          "title": "设计",
          "description": "从分类列表中选择对象的服装样式 。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外装配细节, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的装配输出替换为您的文本 。"
        }
      },
      "fields": {
        "outfitStyle": {
          "label": "绝配样式",
          "description": "从分类列表中选择想要的 & Tate",
          "placeholder": "选择一个样式",
          "categories": {
            "boys": "男 学 生",
            "costume": "服装",
            "general": "常规",
            "girls": "女生人数"
          },
          "options": {
            "boyish_casual_outfit": "包 机 机",
            "casual_outfit": "临时外派",
            "cute_dress_outfit": "可爱的服装",
            "elegant_girls_outfit": "女优、女优、",
            "fantasy_warrior_costume": "奇幻战士服装",
            "festive_outfit": "纽约",
            "formal_boys_outfit": "正规男子",
            "formal_outfit": "正式设计",
            "girlish_casual_outfit": "包机 包机",
            "hoodie_and_jeans_outfit": "乌迪和吉恩",
            "luxury_outfit": "豪华地产",
            "magical_wizard_costume": "魔术师服装",
            "medieval_knight_costume": "内华达·科斯特",
            "party_dress_outfit": "党 服装",
            "princess_costume": "服装公主",
            "sci_fi_space_suit": "缩写:Sci-Fi",
            "sporty_boys_outfit": "男子 男子 男子",
            "sporty_outfit": "国家 国家 国家",
            "superhero_costume": "超英雄服装",
            "traditional_ethnic_outfit": "传统民族文化"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外装配细节, 不替换生成的输出 。",
          "placeholder": "添加额外的装饰细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您自己的装备说明, 并替换生成的输出 。",
          "placeholder": "写您自定义的文本..."
        }
      }
    },
    "hair": {
      "title": "头发",
      "description": "控制对象的发型、颜色、纹理和装饰性装饰。",
      "groups": {
        "core": {
          "title": "头发",
          "description": "选择发型、 颜色和纹理 。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外发条, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的毛发输出替换为您的文本 。"
        }
      },
      "fields": {
        "hairStyle": {
          "label": "毛发样式",
          "description": "从分类列表中选择 Tate 。",
          "placeholder": "选择发型",
          "categories": {
            "boys_masculine": "男/女",
            "fantasy_stylized": "幻觉/ 时尚化",
            "general": "常规",
            "girls_feminine": "女孩/女性",
            "hair_styling_accessories": "发型/辅助器",
            "iconic_celebrity_inspired": "图标/名人灵感"
          },
          "options": {
            "anime_spiky_hair": "Anime Spiky 头发",
            "bob_haircut": "鲍勃·海克特",
            "braided_crown": "银冠",
            "braided_hairstyle": "毛发风格",
            "classic_rockabilly_pompadour": "古典摇滚乐",
            "classic_short_boys_haircut": "经典短毛男",
            "cloud_like_hair": "乌云如云",
            "covered_hair_or_scarf": "头发或疤痕",
            "curly_boys_hairstyle": "卷毛男",
            "curly_feminine_hair": "卷发",
            "curly_voluminous_hair": "卷发",
            "decorative_hair_ornaments": "装饰性发型",
            "elf_like_long_hair": "长发精灵",
            "fantasy_warrior_hair": "幻想战士发型",
            "fashion_editorial_hair": "时装编辑发型",
            "fire_like_hair": "发型一样",
            "floating_gravity_defying_hair": "漂浮重力击败毛发",
            "formal_styled_hair": "正规发型",
            "glam_rock_layered_hair": "胶状岩层毛",
            "glamorous_waves": "巨浪",
            "hair_under_hat": "头发下",
            "hair_with_bow": "发型与鲍",
            "hair_with_clips": "带剪贴板的毛",
            "hair_with_headband": "带头带的头发",
            "high_ponytail": "高马尾巴",
            "ice_like_hair": "冰像头发",
            "k_pop_idol_hairstyle": "K-Pop 依尔式",
            "long_elegant_hair": "长发",
            "long_flowing_hair": "长发",
            "long_masculine_hair": "长毛",
            "low_ponytail": "低马尾",
            "magical_glowing_hair": "神奇的光荣发型",
            "medium_natural_hair": "中自然毛",
            "mermaid_flowing_hair": "美人鱼流发",
            "messy_boyish_hair": "乱七八糟的毛发",
            "messy_casual_hair": "伤性头髮",
            "messy_festival_hair": "乱七八糟的头发",
            "modern_fade_haircut": "现代发型",
            "nineties_boyband_curtain_hair": "九十九个男孩 卷发",
            "old_hollywood_blonde_waves": "好莱坞金发大浪",
            "pixie_cut": "精灵剪切",
            "pop_star_wet_look_hair": "流行星湿眼头发",
            "princess_like_hair": "长发公主",
            "punk_mohawk": "庞克·莫霍克",
            "retro_beehive_hairstyle": "异性蜂窝发型",
            "rock_singer_shag_haircut": "摇滚歌手 Shag头发",
            "rockstar_messy_hair": "摇滚明星发型",
            "sculptural_stylized_hair": "雕塑型发型",
            "shaved_or_buzz_cut": "剃刀或巴兹切除",
            "short_clean_hair": "短发",
            "side_part_hairstyle": "毛发侧面",
            "slicked_back_hair": "后发滑动",
            "soft_layered_hair": "软层毛",
            "spiky_hair": "毛发",
            "sports_tied_back_hair": "运动带回头发",
            "straight_smooth_hair": "直发",
            "textured_crop_hairstyle": "纹理作物毛型",
            "twin_tails": "双尾",
            "undercut_hairstyle": "剪头发",
            "vintage_cinema_star_waves": "明星浪潮电影院",
            "wavy_soft_hair": "华夫特头发",
            "wet_look_hair": "潮湿头发",
            "wind_blown_hair": "风光"
          }
        },
        "hairColor": {
          "label": "发色",
          "description": "选个毛色",
          "placeholder": "选择发色"
        },
        "hairTexture": {
          "label": "毛纹理",
          "description": "从列表中选择毛质 。",
          "placeholder": "选择毛纹理",
          "options": {
            "coarse": "粗鲁",
            "coily": "缩写",
            "curly": "旋转",
            "fine": "精细",
            "fluffy": "毛发",
            "glossy": "光滑",
            "matte": "玛特",
            "sculpted": "缩写",
            "silky": "丝绸",
            "straight": "直线",
            "thick": "厚",
            "wavy": "纽约"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加可选的额外发条, 不替换生成的输出 。",
          "placeholder": "添加额外的头发细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写下自己的发型 并替换生成的输出 。",
          "placeholder": "写下你的发型"
        }
      }
    },
    "effects": {
      "title": "效果",
      "description": "控制图像的视觉和文体效应,如照片、小故障或神奇效应。",
      "groups": {
        "core": {
          "title": "效果",
          "description": "选择效果样式和强度。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外效果说明, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的效果输出替换为您自己的文本 。"
        }
      },
      "fields": {
        "effectStyle": {
          "label": "效果样式",
          "description": "从分类列表中选择一个或数个效果",
          "placeholder": "选择效果样式",
          "categories": {
            "atmospheric": "空气中",
            "digital_glitch": "数字/ Glitch",
            "film_analog": "胶片/ 类似",
            "light_glow": "灯 / 光",
            "motion_energy": "动议/能源",
            "photographic": "摄影",
            "print_poster": "打印/ 海报",
            "quality_degradation": "质量退化",
            "surreal_magical": "超真实/ 魔术",
            "ui_graphic": "UI / 图形"
          },
          "options": {
            "35mm_film_effect": "35毫米胶片效果",
            "analog_film_grain": "模拟胶片质",
            "bloom_glow": "闪光光",
            "chromatic_aberration": "色差",
            "comic_dot_shading": "漫画点阴影",
            "comic_speech_bubble": "漫画泡泡",
            "datamosh_artifact": "Datamosh 人工成形术",
            "depth_haze": "深度遮蔽",
            "digital_noise": "数字噪音",
            "dust_and_scratches": "尘土和刮痕",
            "dust_particles": "尘粒",
            "energy_aura": "能源奥拉",
            "ethereal_aura": "极光",
            "film_grain": "胶片颗粒",
            "floating_sparkles": "浮动闪烁",
            "fog_overlay": "雾覆盖",
            "glitch_distortion": "闪烁扭曲",
            "halftone_effect": "半调效果",
            "hud_overlay": "HUD 重叠",
            "jpeg_artifacts": "JPEG 人工制品",
            "lens_flare": "镜头点火",
            "light_leak_effect": "浅漏效应",
            "low_quality": "低质量",
            "lowres_artifact": "低精度",
            "magical_particles": "魔幻粒子",
            "misty_glow": "雾光",
            "motion_blur": "动作模糊",
            "motion_trails": "移动轨迹",
            "neon_glow": "亮光",
            "pixel_sorting": "像素排序",
            "pixelated_image": "像素图像",
            "rain_droplets": "雨滴",
            "rgb_split_effect": "RGB 启动",
            "risograph_misregistration": "人口统计",
            "scanline_effect": "扫描效果",
            "screen_distortion": "屏幕扭曲",
            "screen_print_texture": "屏幕纹理",
            "shallow_bloom": "浅蓝色",
            "soft_focus": "软焦点",
            "soft_halo": "软光",
            "sparkle_highlights": "闪光",
            "speed_lines": "速度线",
            "subtle_vignette": "精细的 Vignette",
            "vhs_tape_effect": "VHS 磁带效果",
            "vintage_film_look": "传统电影"
          }
        },
        "effectIntensity": {
          "label": "效果强度",
          "description": "选择效果的强度 。",
          "placeholder": "选择效果强度...",
          "options": {
            "balanced": "余额",
            "extreme": "极端",
            "strong": "坚硬的",
            "subtle": "精细"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加效果的可选说明或澄清, 但不替换生成的输出 。",
          "placeholder": "添加额外效果的细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您自己的指令, 以覆盖生成的 suffect 。",
          "placeholder": "写入您的自定义效果文本..."
        }
      }
    },
    "camera": {
      "title": "镜头",
      "description": "控制图像的相机类型和镜头视角,包括一般镜头样式或特定相机模型。",
      "groups": {
        "core": {
          "title": "镜头",
          "description": "选择相机样式和模型。"
        },
        "advanced": {
          "title": "高级细节",
          "description": "添加可选的额外相机指令, 不替换生成的输出 。"
        },
        "override": {
          "title": "自定义覆盖",
          "description": "将生成的相机输出替换为您的文本 。"
        }
      },
      "fields": {
        "cameraStyle": {
          "label": "图像样式",
          "description": "从分类列表中选择相机样式或特定相机模型。",
          "placeholder": "选择一个相机样式...",
          "categories": {
            "analog": "模拟",
            "digital": "数字",
            "general": "常规"
          },
          "options": {
            "canon_ae1": "卡农 AE-1",
            "contax_t2": "语法 T2",
            "hasselblad_500c": "哈塞尔布拉德 500C",
            "kodak_disposable": "Kodak 可处理",
            "leica_m6": "莱卡 M6",
            "lomography": "缩写",
            "nikon_f3": "内科纳 F3",
            "pentax_k1000": "笔记本 K1000",
            "polaroid_sx70": "标注 SX-70",
            "rolleiflex": "滚动式",
            "action_camera": "动作相机",
            "aerial_drone": "空中无人驾驶",
            "arri_alexa": "ARRI 亚历克萨",
            "blackmagic_pocket": "黑魔法袋",
            "canon_eos_r5": "卡农 EOS R5",
            "cinematic_camera": "电影摄影机",
            "deep_focus": "深聚焦",
            "documentary_camera": "纪录相机",
            "fisheye_lens": "鱼眼透镜",
            "fujifilm_gfx_100s": "藤胶卷 GFX 100天",
            "fujifilm_x100v": "藤胶卷 X100V",
            "handheld_camera": "手持相机",
            "hasselblad_x2d": "哈塞尔布拉德 X2D",
            "leica_q2": "莱卡 Q2",
            "leica_sl2": "莱卡 SL2",
            "macro_lens": "宏镜头",
            "nikon_z8": "内科纳 Z8",
            "portrait_lens": "纵向镜头",
            "red_komodo": "RED 科莫多",
            "security_camera": "警卫摄像头",
            "shallow_dof": "浅 DOF",
            "smartphone_camera": "智能手机",
            "sony_a7r_iv": "索尼族 A7R IV",
            "sony_a7s_iii": "索尼族 A7S III",
            "telephoto_compression": "电传压缩",
            "ultra_wide_angle": "超宽角",
            "webcam_camera": "网络相机",
            "wide_angle_lens": "宽镜"
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "为相机添加可选说明或澄清, 但不替换生成的输出 。",
          "placeholder": "添加额外的相机细节..."
        },
        "customText": {
          "label": "自定义覆盖",
          "description": "写入您的指令以覆盖生成的相机输出 。",
          "placeholder": "写下您的自定义相机文本..."
        }
      }
    },
    "colorPalette": {
      "title": "调色板",
      "description": "使用自定义的颜色或预定义的调色板控制图像的颜色主题 。",
      "groups": {
        "core": {
          "title": "核心",
          "description": "为图像的特定部分指定调色板或自定义颜色, 如背景、 服装、 照明等 。"
        },
        "advanced": {
          "title": "高级",
          "description": "添加关于颜色使用的可选便条, 但不替换所显示的调色板 。 @ info: whatsthis"
        }
      },
      "fields": {
        "paletteAssignments": {
          "label": "颜色任务",
          "description": "为图像的特定部分指定调色板或自定义颜色, 如背景、 服装、 照明等 。",
          "placeholder": "选择调色板任务",
          "actions": {
            "addAssignment": "添加任务",
            "remove": "删除",
            "addColor": "添加颜色"
          },
          "modes": {
            "custom": "自定义",
            "preset": "预设"
          },
          "ruleTitle": "调色板规则",
          "usages": {
            "accents": "缩进",
            "background": "背景情况",
            "hair": "头发",
            "lighting": "照明",
            "outfit": "设计",
            "overall": "A. 总表",
            "subject": "主题 :"
          },
          "controls": {
            "color": {
              "placeholder": "选择或输入颜色"
            }
          }
        },
        "extraDetails": {
          "label": "额外细节",
          "description": "添加关于颜色使用的可选便条, 但不替换所显示的调色板 。 @ info: whatsthis",
          "placeholder": "添加调色板细节..."
        },
        "customText": {
          "description": "如果填满, 此文本将成为最后调色板输出, 所有其他调色板字段将被忽略 。",
          "label": "自定义调色板",
          "placeholder": "写入完整的调色板配置"
        }
      }
    },
    "typography": {
      "description": "创建结构化的打印指令, 包括可重复使用的文本组、布局、 等级和样式细节 。",
      "fields": {
        "textGroups": {
          "description": "定义打印组、文字内容、位置、等级和视觉样式。",
          "label": "文本组",
          "actions": {
            "addGroup": "添加组",
            "cancel": "取消",
            "create": "创建",
            "save": "保存",
            "confirmDelete": "删除"
          },
          "block": {
            "actions": {
              "remove": "删除",
              "edit": "编辑文本",
              "moveUp": "向上移动",
              "moveDown": "向下移动"
            },
            "controls": {
              "additionalDescription": {
                "label": "额外说明",
                "placeholder": "添加外观、布局、可读性或视觉行为说明..."
              },
              "fontSize": {
                "label": "字体"
              },
              "fontStyle": {
                "label": "缩写",
                "groups": {
                  "presets": "字体预设",
                  "variables": "字型变量"
                }
              },
              "fontWeight": {
                "label": "字体"
              },
              "purpose": {
                "label": "文字目的"
              },
              "text": {
                "label": "文字 :",
                "placeholder": "写出文字内容..."
              },
              "customFontStyle": {
                "label": "自定义字体",
                "placeholder": "描述自定义字体样式、 字母状态或刻度刻度标记"
              },
              "customFontSize": {
                "label": "自定义字体",
                "placeholder": "描述一个自定义大小, 如大标题, 小标题, 大 3D 字母, 或平衡的体文本..."
              },
              "customFontWeight": {
                "label": "自定义字体",
                "placeholder": "描述一个特制的重量,例如超粗、稀薄、轻、粗重、粗糙或粗糙的粗糙..."
              },
              "customPurpose": {
                "label": "自定义",
                "placeholder": "描述该文本的自定义作用, 如品牌名称、 轨道标签、 图示、 标题、 字幕或装饰类型..."
              }
            },
            "validation": {
              "requiredTextEmpty": "需要文字内容。"
            },
            "modal": {
              "createTitle": "创建文本",
              "editTitle": "编辑文本",
              "stableKey": "稳定打字键"
            }
          },
          "count": "{count} 文本组",
          "group": {
            "actions": {
              "addText": "添加文本",
              "remove": "删除组",
              "edit": "编辑组"
            },
            "controls": {
              "additionalDescription": {
                "label": "额外说明",
                "placeholder": "显示距离、 轨道行为、 深度、 可读性或自定义布局细节"
              },
              "alignment": {
                "label": "对齐"
              },
              "direction": {
                "label": "方向"
              },
              "distribution": {
                "label": "分发"
              },
              "groupPurpose": {
                "label": "组合用途"
              },
              "positionPreset": {
                "label": "位置",
                "groups": {
                  "presets": "预设位置",
                  "layout": "区域",
                  "custom": "自定义"
                },
                "custom": "自定义位置",
                "missingRegion": "缺少布局区域"
              },
              "writingDirection": {
                "label": "写进方向"
              },
              "customPositionDescription": {
                "label": "自定义位置",
                "placeholder": "描述此文本组的自定义位置、 位置逻辑、 轨道路径、 间距或布局行为..."
              },
              "customGroupPurpose": {
                "label": "自定义组"
              }
            },
            "textBlocksTitle": "文本块",
            "list": {
              "textCount": "{count} 文本编号 :",
              "customPosition": "自定义位置"
            },
            "emptyTexts": "还没有添加到该组 。",
            "modal": {
              "createTitle": "创建文本组",
              "editTitle": "编辑文本组",
              "deleteTitle": "删除文本组",
              "deleteDescription": "文本组及其所有文本项目将被删除。",
              "stableKey": "稳定打字组"
            }
          },
          "title": "缩写组",
          "empty": {
            "description": "创建至少一个打印组, 然后在其中添加文本块 。",
            "title": "还没有打印组"
          }
        },
        "extraDetails": {
          "description": "添加适用于所有文本组的全局打印注释, 如可读性、布局行为、 材料或视觉情绪 。",
          "label": "额外细节",
          "placeholder": "描述任何全局性打字规则、 可读性说明、 材料细节或自定义布局行为..."
        },
        "textAccuracy": {
          "description": "控制生成的结果如何严格地保存 。",
          "label": "文本精确度",
          "options": {
            "exact": "精确",
            "flexible": "灵活",
            "readable": "可读"
          }
        }
      },
      "groups": {
        "advanced": {
          "description": "精细的打字细节,如间距、材料、可读性、深度和布局行为。",
          "title": "高级拼写"
        },
        "core": {
          "description": "定义主要打字结构、文本组、内容、等级和位置。",
          "title": "缩写"
        }
      },
      "title": "缩写"
    },
    "variables": {
      "description": "创建可重新使用的快速变量,可插入快速字段,并在模块中重新使用。",
      "fields": {
        "variables": {
          "description": "定义文本、主题、颜色、引用、对象或自定义提示值的指定变量。",
          "label": "开关",
          "types": {
            "color": "颜色",
            "custom": "自定义",
            "object": "对象",
            "reference": "参考文献",
            "subject": "主题 :",
            "text": "文字 :",
            "font": "缩写"
          },
          "actions": {
            "add": "添加变量",
            "duplicate": "复制",
            "remove": "删除",
            "edit": "编辑变量",
            "save": "保存更改",
            "create": "创建 KTA 变量",
            "cancel": "取消",
            "delete": "删除 KTLT 变量",
            "confirmDelete": "删除 KTLT 变量"
          },
          "controls": {
            "description": {
              "label": "显示",
              "placeholder": "可选的内部注释"
            },
            "key": {
              "label": "密钥",
              "placeholder": "变量名称"
            },
            "type": {
              "label": "类型"
            },
            "value": {
              "label": "数值",
              "placeholder": "写入变量..."
            },
            "enabled": {
              "label": "启用变量"
            }
          },
          "outputToken": "输出调制",
          "picker": {
            "search": {
              "placeholder": "搜索变量..."
            },
            "empty": {
              "description": "首先创建至少一个变量,然后您可以将其插入提示字段。",
              "title": "未找到变量"
            },
            "systemVariables": {
              "label": "系统变量"
            },
            "sources": {
              "user": "用户",
              "system": "系统"
            },
            "tabs": {
              "user": "用户",
              "system": "系统"
            }
          },
          "empty": {
            "title": "还没有变量",
            "description": "添加第一个变量,然后插入到任何提示字段中 。"
          },
          "list": {
            "count": "{count} 变数",
            "hint": "点击一个变量 控件 。",
            "emptyValue": "无",
            "disabled": "禁用"
          },
          "modal": {
            "createTitle": "添加变量",
            "editTitle": "编辑 {token}",
            "editorSubtitle": "定义一个变量, 然后在提示字段中再使用它 。",
            "deleteTitle": "删除 KTLT 变量",
            "deleteDescription": "您确定要删除 {token}?",
            "deleteWarning": "如果此标记用于其他提示字段, 则不再被值所取代 。"
          },
          "validation": {
            "invalidKey": "无效的变量密钥 。",
            "reservedKey": "此密钥用于内部打字标记 。",
            "duplicateKey": "重复变量密钥 。",
            "systemKey": "此密钥由运行中的系统变量保留 。"
          }
        }
      },
      "groups": {
        "core": {
          "description": "管理提示编辑器内可用的可重复变量主列表 。",
          "title": "核心变量"
        }
      },
      "title": "开关"
    },
    "layout": {
      "description": "定义最终图像的布局结构、构成、视觉等级、密度和可重复使用区域。",
      "fields": {
        "composition": {
          "description": "选择在画布中如何排列主要视觉区域 。",
          "label": "组成",
          "options": {
            "asymmetric_editorial": "缩写 缩写",
            "centered_stack": "居中堆叠",
            "comic_panels": "漫画面板",
            "freeform": "自由型",
            "full_bleed": "满血",
            "image_with_bottom_panel": "使用底部面板",
            "image_with_side_panel": "使用侧面板",
            "layered_collage": "层拼贴",
            "modular_grid": "模块网格",
            "single_focal": "统一联络人",
            "split_horizontal": "水平",
            "split_vertical": "垂直显示"
          }
        },
        "density": {
          "description": "控制屏幕上显示多少图像信息、 间距和内容 。",
          "label": "密度",
          "options": {
            "balanced": "余额",
            "dense": "浓度",
            "maximal": "最大",
            "sparse": "缩放"
          }
        },
        "hierarchy": {
          "description": "界定在最终构成中哪些内容类型最为重要。",
          "label": "分级",
          "options": {
            "balanced": "余额",
            "image_dominant": "图像主控",
            "information_dominant": "信息主导者",
            "product_dominant": "产品",
            "text_dominant": "文本主导"
          }
        },
        "layoutType": {
          "description": "选择总体布局格式或设计使用选项。",
          "label": "布局类型",
          "options": {
            "banner": "横幅",
            "business_card": "商务卡",
            "collage": "拼贴",
            "comic_page": "动画页面",
            "cover": "封面",
            "custom": "自定义",
            "editorial_page": "编辑版",
            "poster": "海报",
            "presentation_slide": "幻灯片",
            "product_sheet": "产品表",
            "social_post": "社会职位"
          }
        },
        "regions": {
          "actions": {
            "add": "添加区域",
            "moveDown": "向下移动",
            "moveUp": "向上移动",
            "remove": "删除",
            "apply": "应用",
            "cancel": "取消",
            "delete": "删除",
            "duplicate": "复制",
            "edit": "编辑",
            "visualBuilder": "视觉构建器",
            "confirmDelete": "删除区域",
            "create": "创建区域",
            "save": "保存"
          },
          "builderDescription": "添加并安排布局区域, 包括角色、坐标、层次、对齐和适合的行为 。",
          "builderTitle": "区域构建器",
          "contentKey": "内容键",
          "coordinates": {
            "height": "高度",
            "width": "宽",
            "x": "页:1",
            "y": "缩略语:"
          },
          "defaultName": "地区",
          "description": "定义自定义布局区域和显示每类内容的控件 。",
          "empty": {
            "description": "创建布局区域, 以定义文本、 图像、 标识、 背景和其他内容应出现的位置 。",
            "title": "还没有布局区域"
          },
          "fit": {
            "contain": "内含",
            "cover": "封面",
            "fill": "填充",
            "natural": "自然型",
            "none": "无"
          },
          "horizontalAlign": {
            "center": "开",
            "end": "结束",
            "start": "开始",
            "stretch": "伸展",
            "none": "无"
          },
          "label": "区域:",
          "layer": "图层",
          "name": "名称",
          "overflow": {
            "hidden": "盖 头",
            "visible": "可见",
            "none": "无"
          },
          "roles": {
            "background": "背景情况",
            "badge": "徽章",
            "cta": "CTA",
            "custom": "自定义",
            "decoration": "装饰",
            "empty_space": "空空空间",
            "hero_image": "英雄图像",
            "logo": "登录",
            "metadata": "基数",
            "supporting_image": "支持图像",
            "text": "文字 :",
            "none": "无"
          },
          "verticalAlign": {
            "center": "开",
            "end": "结束",
            "start": "开始",
            "stretch": "伸展",
            "none": "无"
          },
          "list": {
            "title": "区域列表",
            "description": "检查、编辑、复制、重新排序或删除布局区域",
            "layer": "图层 {layer}",
            "bounds": "页:1 {x} · 国家 {y} 妇女 妇女 {width} · 妇女 {height}",
            "contentKey": "{key}",
            "contentKeyEmpty": "没有指定内容"
          },
          "visualBuilder": {
            "grid": {
              "apply": "应用网格",
              "columns": "列数",
              "description": "设置用于绘制和抓取视觉布局区域的网格大小 。",
              "rows": "直线",
              "title": "创建器网格",
              "pendingChange": "网格变化"
            },
            "hint": "在网格上绘制或选择单元格, 以直观定义显示区域 。",
            "modal": {
              "subtitle": "直接在屏幕上创建和调整布局区域 。",
              "title": "视觉区域构建器"
            },
            "regionCount": "{count} 区域",
            "selectionSummary": "{count} 选择的单元格",
            "tools": {
              "draw": "绘制",
              "select": "选择"
            },
            "gridReset": {
              "confirm": "应用网格重置",
              "description": "更改网格大小将重置当前视觉构建器的选择, 并可能影响现有区域位置 。",
              "subtitle": "在应用新网格前先检查一下。",
              "title": "重置构建器网关 ?"
            }
          },
          "controls": {
            "contentKey": {
              "label": "内容键",
              "placeholder": "输入可变密钥或内容引用..."
            },
            "description": {
              "label": "显示",
              "placeholder": "描述一下这个区域应该包含什么,或者说..."
            },
            "fit": {
              "label": "适合"
            },
            "geometry": {
              "description": "使用常规布局值设置区域位置、 大小和层 。",
              "height": "高度",
              "layer": "图层",
              "title": "几何学",
              "width": "宽",
              "x": "页:1",
              "y": "缩略语:"
            },
            "horizontalAlign": {
              "label": "水平对齐"
            },
            "name": {
              "label": "名称",
              "placeholder": "区域名称 :"
            },
            "overflow": {
              "label": "溢出"
            },
            "role": {
              "label": "角色"
            },
            "verticalAlign": {
              "label": "垂直对齐"
            },
            "customRole": {
              "label": "自定义角色",
              "placeholder": "描述一下这个区域..."
            }
          },
          "modal": {
            "createTitle": "创建区域",
            "deleteDescription": "此区域将从布局中删除。 无法撤消此操作 。 @ info: whatsthis",
            "deleteTitle": "删除区域",
            "editorSubtitle": "配置区域作用、内容、几何、对齐、合适和溢出行为。",
            "editTitle": "编辑区域"
          },
          "validation": {
            "invalidGeometry": "区域几何无效。 请检查 Kate 的 X、 Y、 宽度和高度 。",
            "customRoleRequired": "当区域角色被设定为定制时,需要自定义角色。"
          }
        },
        "extraDetails": {
          "description": "添加全局布局注释, 如间距、 视觉流、 构成规则、 边距、 安全区域、 或自定义布局行为 。",
          "label": "额外细节",
          "placeholder": "描述任何全局布局规则、 间距笔记、 安全区域、 边距、 视觉流、 或自定义布局行为..."
        }
      },
      "groups": {
        "advanced": {
          "description": "精密的密度,等级, 高级的布局行为",
          "title": "高级布局"
        },
        "regions": {
          "description": "为文本、图像、标识、背景和其他布局元素创建自定义区域。",
          "title": "区域"
        },
        "structure": {
          "description": "选择主布局类型、 组成样式和总体结构 。",
          "title": "结构"
        }
      },
      "title": "图像",
      "schema": {
        "actions": {
          "copied": "收到",
          "copy": "复制",
          "copyJson": "复制 JSON"
        }
      }
    }
  },
  "panel": {
    "keyModule": "密钥模块",
    "customMode": "自定义",
    "clear": "清除",
    "clearCustom": "清除自定义",
    "copy": "复制",
    "copied": "收到",
    "none": "无",
    "presets": "预设",
    "presetsDescription": "快速选择",
    "presetSelected": "预设",
    "compiledOutput": "输出",
    "emptyOutput": "还没有输出",
    "emptyOutputTitle": "还没有产生",
    "emptyOutputDescription": "选择一个预设或填充上面的字段 。",
    "emptyCustomOutputDescription": "写入自定义描述以生成此模块输出 。",
    "customOverrideActive": "自定义覆盖活动",
    "customOverrideEmpty": "自定义模式已激活, 但自定义输出为空 。",
    "fieldsFilled": "填进",
    "multiSelectHint": "按下 Ctrl/ Cmd 选择多个选项 。",
    "emptyModuleTitle": "无可配置域",
    "emptyModuleDescription": "此模块尚未显示字段 。",
    "expand": "展开",
    "collapse": "缩放 缩放",
    "statusEmpty": "空端",
    "statusPartiallyFilled": "部分填补",
    "statusPreset": "应用的预设",
    "statusCustom": "自定义覆盖",
    "statusCustomEmpty": "自定义空"
  },
  "home": {
    "eyebrow": "快速生成器",
    "title": "Prompt Draft",
    "description": "使用可重复使用的密钥模块构建模块化、以计划驱动的提示。",
    "createPrompt": "创建提示"
  },
  "create": {
    "draft": {
      "download": "下载草稿",
      "share": "共享草稿",
      "shareText": "Prompt Draft JSON 导出",
      "importJson": "导入 JSON",
      "exportJson": "导出 JSON",
      "importModal": {
        "errorTitle": "导入失败",
        "errorDescription": "选中的 JSON 文件无效 Prompt Draft 导出。 请选择草稿 JSON 来,来..."
      },
      "titlePlaceholder": "标题草案...",
      "menu": "草稿",
      "createNew": "创建新草稿",
      "defaultTitle": "草案 {index}",
      "delete": "删除草稿",
      "deleteModal": {
        "title": "删掉稿子?",
        "description": "删去 \"{title}\" 永久的?",
        "lastDraftDescription": "删去 \"{title}\" 永久?这是你唯一保存的草稿,所以在删除后将创建一个空白的草稿。",
        "confirm": "删除草稿"
      },
      "restoring": "正在恢复的草稿...",
      "saving": "正在保存...",
      "savedAt": "保存于 {time}",
      "newDraft": "新草案",
      "clear": "清除草稿",
      "clearConfirm": "清除整个草稿吗?"
    },
    "tabs": {
      "setup": "设置",
      "editor": "编辑器",
      "output": "输出"
    },
    "eyebrow": "快速构建器",
    "title": "创建提示",
    "description": "选择密钥模块, 编辑它们的值, 并生成一个合并的提示输出 。",
    "backHome": "回来",
    "modulesTitle": "密钥模块",
    "modulesDescription": "选择要包含的模块 。",
    "outputTitle": "全球输出",
    "outputDescription": "由选定模块产生的合并输出。",
    "emptyOutput": "还没编好呢",
    "outputFormats": {
      "modular": "模块",
      "natural": "自然型",
      "json": "JSON"
    }
  },
  "promptSetup": {
    "title": "快速设置",
    "description": "定义您快速的全局结构和背景 。",
    "mode": {
      "title": "提示类型",
      "description": "选择如何解释提示 。",
      "options": {
        "text_to_image": {
          "label": "文本到图像",
          "description": "从 Tate 生成图像。"
        },
        "image_to_image": {
          "label": "图像",
          "description": "转换一个附加的参考图像。"
        }
      }
    },
    "idea": {
      "label": "想法",
      "description": "说明主要概念或转变目标。",
      "placeholder": "示例: 将输入肖像转换为三维元元..."
    },
    "core": {
      "title": "核心环境",
      "label": "定义生成的提示主机和主题"
    },
    "output": {
      "title": "输出对比",
      "label": "控制花粉、侧比和全球快速规则"
    },
    "subject": {
      "label": "主题 :",
      "description": "定义提示的主题 。",
      "placeholder": "示例: 附加参考图像中的人"
    },
    "aspectRatio": {
      "label": "比例",
      "description": "选择最终图像侧面比例 。",
      "groups": {
        "common": {
          "label": "常见比率"
        },
        "printCards": {
          "label": "打印卡"
        },
        "printIso": {
          "label": "ISO 纸张大小"
        },
        "printPosters": {
          "label": "打印海报"
        },
        "social": {
          "label": "社会媒体"
        },
        "socialBanners": {
          "label": "社会奖杯"
        },
        "webUiAds": {
          "label": "韦伯 UI 广告( A)"
        }
      },
      "options": {
        "a0Landscape": {
          "label": "A0 横向",
          "description": "大型 ISO 打印格式,适合超大版面的海报、横幅、展览图画和大布局。"
        },
        "a0Portrait": {
          "label": "A0 纵向",
          "description": "大型 ISO 打印格式,适合超大版面的海报、标语、展览图片和优异版面。"
        },
        "a1Landscape": {
          "label": "A1 横向",
          "description": "开 A1 打印格式,用于海报、演示板、事件图形和大水平布局。"
        },
        "a1Portrait": {
          "label": "A1 纵向",
          "description": "直线 A1 印刷版,适合 海报,公告板,活动设计 和大型宣传品。"
        },
        "a2Landscape": {
          "label": "A2 横向",
          "description": "水平 A2 打印格式,用于中等规模的海报、板块、菜单和宣传布局。"
        },
        "a2Portrait": {
          "label": "A2 纵向",
          "description": "直线 A2 印刷格式,适合张贴海报、艺术印刷品、活动通知和中型促销设计。"
        },
        "a3Landscape": {
          "label": "A3 横向",
          "description": "水平 A3 格式,用于海报、演示文稿、菜单和缩略图。"
        },
        "a3Portrait": {
          "label": "A3 纵向",
          "description": "直线 A3 格式,适合海报、传单、演示文稿和压缩印刷版面。"
        },
        "a4Landscape": {
          "label": "A4 横向",
          "description": "标准水平文档格式,用于打印工具"
        },
        "a4Portrait": {
          "label": "A4 纵向",
          "description": "标准垂直文档格式,适合显示文件、传单、工作表和日常打印设计。"
        },
        "a5Landscape": {
          "label": "A5 横向",
          "description": "压缩水平打印格式,用于小卡片、传单、邀请函和折叠打印设计。"
        },
        "a5Portrait": {
          "label": "A5 纵向",
          "description": "紧凑的垂直打印格式,适合传单、小海报、小册子封面和手持印刷设计。"
        },
        "a6Landscape": {
          "label": "A6 横向",
          "description": "小型水平打印格式,用于明信片、紧凑传单、优惠券和小宣传卡。"
        },
        "a6Portrait": {
          "description": "小垂直打印格式,适合压缩卡片、传单和手持设备设计。",
          "label": "A6 纵向"
        },
        "albumCover": {
          "label": "专辑封面",
          "description": "平方封面格式, 适合音乐专辑、 播放列表艺术作品、 播客封面、 以及视觉身份图形 。"
        },
        "appSplashLandscape": {
          "label": "启动屏幕",
          "description": "水平应用程序飞溅屏幕格式, 用于地貌移动或平板启动屏幕 。"
        },
        "appSplashPortrait": {
          "label": "启动屏幕",
          "description": "垂直应用程序飞溅屏幕格式, 适合移动启动屏幕, 上载视觉, 以及应用程序启动图形 。"
        },
        "bookCover": {
          "label": "书籍封面",
          "description": "纵向书籍封面格式,适合小说、指南、电子书籍和编辑封面设计。"
        },
        "businessCardHorizontal": {
          "description": "标准水平名片,适合印制身份设计。",
          "label": "横向"
        },
        "businessCardVertical": {
          "label": "标注",
          "description": "适用于现代身份证、个人品牌和紧凑的联系人布局的垂直名片格式。"
        },
        "commonCinematicWide": {
          "label": "电视",
          "description": "超大范围影视比例,可用于戏剧场景、电影框、拖车和全景成份。"
        },
        "commonLandscapeFiveFour": {
          "label": "风景 :",
          "description": "平衡5:4的景观比,适合编辑版式、框架印刷和受控水平构成。"
        },
        "commonLandscapeFourThree": {
          "description": "经典4: 3景观比,可用于演示、编辑版式和一般图像构成。",
          "label": "场景 4: 3"
        },
        "commonPhotoLandscape": {
          "label": "相片景观",
          "description": "古典风景照片比例,可用于摄影、产品拍摄、旅行场景和水平图像布局。"
        },
        "commonPhotoPortrait": {
          "label": "相片肖像",
          "description": "经典肖像比例,适合肖像、时装照片、产品图像和垂直成份。"
        },
        "commonPortraitFourFive": {
          "label": "纵向 : 5",
          "description": "流行的垂直4:5比率,可用于社会职位、肖像、产品展示和方便饲料的布局。"
        },
        "commonPortraitThreeFour": {
          "label": "纵向 :",
          "description": "典型的垂直3: 4比例,适合肖像、海报、卡片和平衡的垂直设计。"
        },
        "commonSquare": {
          "label": "1号广场",
          "description": "简单平方比例,适合图标,覆盖,产品拍摄,社会文章,以及平衡的中央成分。"
        },
        "commonVertical": {
          "label": "数字",
          "description": "高垂直比例,适合故事、雷尔、移动第一海报和全屏社交媒体布局。"
        },
        "commonWidescreen": {
          "label": "宽屏 :",
          "description": "标准宽屏比例,用于视频、缩略图、演示文稿、横幅和水平构成。"
        },
        "facebookPageCover": {
          "label": "Facebook 页面",
          "description": "Facebook网页封面格式,适合品牌标本、竞选视觉和社交形象标语。"
        },
        "greetingCardSquare": {
          "label": "贺卡广场",
          "description": "广场贺卡格式,用于庆祝卡、请柬、礼品券和社交问候。"
        },
        "instagramLandscapePost": {
          "label": "图像显示",
          "description": "横向的Instagram 张贴格式, 适合大范围的产品拍摄、 摄影、 公告和种子内容 。"
        },
        "instagramPhotoPost": {
          "label": "图片",
          "description": "标准Instagram照片格式,用于清洁图片、生活方式图像和视觉反馈内容。"
        },
        "instagramPortraitPost": {
          "label": "图像显示",
          "description": "垂直的Instagram种子格式,适合产品展示、肖像、海报和高影响员额。"
        },
        "instagramSquarePost": {
          "description": "经典平方Instagram 邮戳格式,适合供料站、产品拍摄和清洁的社会布局。",
          "label": "图像"
        },
        "instagramStoryReel": {
          "label": "内幕/ 内幕",
          "description": "全屏垂直Instagram格式,适合故事、卷轴、短片和移动第一海报。"
        },
        "invitationLandscape": {
          "label": "邀请",
          "description": "横向邀请格式,用于活动卡、婚礼邀请、公告和优雅的打印版式。"
        },
        "invitationPortrait": {
          "label": "邀请",
          "description": "垂直邀请格式, 适合活动卡、 婚礼邀请、 公告和正式布局 。"
        },
        "leaderboardAd": {
          "label": "头板",
          "description": "大型横向广告格式,适合网站头版、展示广告、竞选横幅和宣传广告。"
        },
        "linkedinCover": {
          "label": "链接封面",
          "description": "广泛链接封面格式,用于专业简介、公司网页、个人品牌和职业视觉。"
        },
        "magazineCover": {
          "label": "杂志封面",
          "description": "纵向杂志封面格式,适合编辑设计、时装封面、专题报道和出版物布局。"
        },
        "mediumRectangleAd": {
          "label": "中矩形 标标",
          "description": "标准中矩形广告格式,可用于网络广告、侧边栏布置和运动创作。"
        },
        "moviePoster": {
          "label": "电影海报",
          "description": "垂直的电影海报格式,适合电影海报, 关键艺术,活动舞会, 和戏剧作品。"
        },
        "postcardHorizontal": {
          "label": "水平",
          "description": "横向明信片格式,用于旅行卡、促销邮件、问候和压缩印刷设计。"
        },
        "postcardVertical": {
          "label": "标注",
          "description": "垂直明信片格式,适合宣传卡、问候、旅行视觉和紧凑的印刷版面。"
        },
        "posterLandscapeFiveFour": {
          "label": "海报:",
          "description": "景观海报比例,框架平衡,适合艺术印刷、公告和横向海报设计。"
        },
        "posterLandscapeFourThree": {
          "label": "海报 4:3",
          "description": "典型的景观海报比例,可用于活动海报、演示图象和广泛的宣传布局。"
        },
        "posterLandscapeThreeTwo": {
          "label": "海报 3:",
          "description": "宽幅画画比,适合电影海报、摄影印和横向运动图画。"
        },
        "posterPortraitFourFive": {
          "label": "海报 4:5",
          "description": "纵向海报比例,可用于社会海报、产品展示、肖像和清洁宣传布局。"
        },
        "posterPortraitThreeFour": {
          "label": "海报 3:4",
          "description": "平衡的纵向海报比例,适合活动海报、编辑图画和印刷版的制作。"
        },
        "posterPortraitTwoThree": {
          "description": "典型的纵向海报比例,适合电影海报、活动海报和印刷宣传设计。",
          "label": "海报:"
        },
        "squareAd": {
          "label": "平面图",
          "description": "广场广告格式,可用于社会广告、产品促销、运动视觉和紧凑广告。"
        },
        "squareBusinessCard": {
          "label": "广场名片",
          "description": "广场名片,适合创作身份证、现代品牌和小型联系人设计。"
        },
        "tiktokShortsReels": {
          "label": "TikTok / 短",
          "description": "全屏垂直短视频格式,适合TikTok、YouTube短裤、Reels和移动第一内容。"
        },
        "webBannerWide": {
          "label": "宽网",
          "description": "网络横幅格式,对网站头条、着陆区、运动横幅和数字促销有用。"
        },
        "websiteHeroUltraWide": {
          "label": "纽约,纽约",
          "description": "超大网站英雄格式,适合沉浸式着陆页、大页头和电影网页视觉。"
        },
        "websiteHeroWide": {
          "description": "网站英雄格式, 用于登陆页面, 头条和大网条。",
          "label": "纽约"
        },
        "xTwitterHeader": {
          "label": "X / 推特信头",
          "description": "广度 X / Twitter 信头格式, 可用于描述、 竞选信头和社交标语设计 。"
        },
        "youtubeChannelBanner": {
          "label": "YouTube频道",
          "description": "YouTube频道的横幅格式, 适合频道品牌、 创建者身份和标题艺术。"
        },
        "youtubeThumbnail": {
          "description": "标准 YouTube 缩略图格式, 适用于视频预览和可点击的覆盖图像 。 @ info: tooltip",
          "label": "YouTube 缩图"
        }
      }
    },
    "globalRules": {
      "label": "全球规则",
      "description": "添加规则,应该影响整个时间。",
      "placeholder": "示例: 保存身份, 保持主题中心, 避免刻板的 身体部件..."
    },
    "imageToImage": {
      "title": "图像到图像显示",
      "description": "定义附加的标签",
      "referenceSubjectType": {
        "label": "参考主题类型",
        "description": "选择附加的 subject 图像 subject, subject",
        "options": {
          "person": "缩写:",
          "object": "对象",
          "animal": "动物",
          "building": "建筑",
          "product": "产品",
          "vehicle": "车辆",
          "scene": "场景/环境",
          "custom": "自定义"
        }
      },
      "customSubject": {
        "label": "自定义主题",
        "description": "为引用图像写入自定义主题 。",
        "placeholder": "举个例子: 手工陶瓷面具, 幻想动物, 抽象雕刻, 雕刻, 雕刻,"
      },
      "subjectDescription": {
        "label": "主题描述",
        "description": "在引用图像中添加主题的可选细节 。",
        "placeholder": "举个例子 卷发和黑帽帽的男子..."
      },
      "generatedSubject": {
        "label": "生成主题",
        "empty": "还没有产生。"
      },
      "referenceUsage": {
        "label": "参考使用",
        "description": "控制输出的强度",
        "options": {
          "strict": "严格引用",
          "balanced": "缩略图",
          "loose": "轻轻的"
        }
      },
      "transformationStrength": {
        "label": "转换",
        "description": "控制结果能从引用图像移动到多远 。",
        "options": {
          "subtle": "精细",
          "balanced": "余额",
          "strong": "坚硬的",
          "extreme": "极端"
        }
      },
      "preserve": {
        "title": "保存选项",
        "description": "选择应标注的标签。",
        "options": {
          "mainSubject": "保留主主题",
          "identity": "保存个人身份",
          "pose": "保持姿势",
          "outfit": "保存设备及可见附件",
          "composition": "保留构成",
          "colors": "保存主颜色",
          "materials": "保存材料和表面细节",
          "lighting": "保护照明和气氛"
        }
      }
    }
  },
  "promptEditor": {
    "emptyTitle": "未选中模块",
    "emptyDescription": "选择至少一个键盘来建立您的提示 。"
  },
  "validation": {
    "title": "需要注意",
    "level": {
      "error": "错误",
      "warning": "警告"
    },
    "noModulesSelected": "从“提示”中至少选择一个“提示”模块。",
    "customOverrideEmpty": "自定义模式 {module},但自定义文本为空。添加自定义文本或关闭自定义文本。",
    "textToImageMissingContext": "对于文本到图像提示, 在快速设置中至少添加一个概念或主题 。",
    "customSubjectEmpty": "引用对象类型设置为自定义对象, 但自定义对象为空。 添加自定义对象或选择其他对象类型 。",
    "ideaEmpty": "说说看",
    "unknown": "来 来 来 来"
  },
  "guide": {
    "title": "校对: 校对:",
    "description": "学习每个已注册的快速模式 。",
    "common": {
      "fields": "字段, 字段",
      "overview": "概览、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、3目、第2目、第2目、第2目、第2目、第2目、第2目、第2目、第2目",
      "whenToUse": "使用",
      "recommendedWorkflow": "23 23 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6",
      "fieldGuide": "指南,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第1页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页,第2页。",
      "tip": "端点",
      "options": "{d} 数字",
      "categories": "{d} 数字",
      "override": "覆盖",
      "optional": "可选",
      "placeholder": "缩放图",
      "backToModules": "回到模块",
      "customTextNote": "此字段被填充后, 将替换生成的模块输出, 并忽略此标签的显示 。",
      "extraDetailsNote": "此字段添加了 KTML 显示的控件"
    },
    "modules": {
      "style": {
        "overview": "Style 模块定义图像的总体艺术语言。 它控制输出是否像 3D 生成、 插图、 绘画、 玩具设计、 编辑艺术、 照片实时工作室图像, 或者其它视觉方向 。",
        "whenToUse": "当您想要设置图像的主要视觉身份时, 请使用此模块 。",
        "workflow": "当您想要一个快速和连贯的方向时, 以样式预设开始。 然后用中、 时态化级别、 形状语言、 视觉处理和完成来精细调整结果。 仅在您自己想要写入全样式指令时使用附加细节进行小添加, 并使用自定义重写 。",
        "fields": {
          "preset": {
            "guide": "预设是定义完整样式方向的最快方法。 它通常将艺术介质、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 图像显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 、 、 显示、 显示、 显示、 显示、 、 显示、 、 、 显示、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 显示、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、",
            "tip": "使用预设。 然后使结果更加具体, 形状的标签 。"
          },
          "medium": {
            "guide": "中标定义图像的基本制作方法,例如 3D 显示、 绘画、 图像、 显示、 显示、 显示、 显示或显示",
            "tip": "显示显示显示端点, 显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示显示显示显示的端点, 显示显示显示显示显示显示的端点显示显示显示显示的端点, 显示显示显示显示显示显示显示的端点"
          },
          "stylizationLevel": {
            "guide": "标准化级别控制着图像远离现实。 低值使得结果更加自然, 而更强的图像则使得更多夸大其词和抽象化。",
            "tip": "使用细微的或控制的提示。 当您想要显示毛片时, 显示毛片 。"
          },
          "shapeLanguage": {
            "guide": "形状语言定义了主题和图像的主要形式。 它可以让结果感觉软、几何、角、阻塞、 液压、 高压、 高压、 高压、 高压、 高压或更结构化。",
            "tip": "这个域对显示显示显示显示显示显示的图像、 玩具、 编辑艺术、 显示显示显示显示显示显示显示显示的显示显示显示显示显示显示显示的显示效果 。 @ action: inmenu"
          },
          "visualTreatment": {
            "guide": "视觉处理控制介质上方的映像行为。 它描述图像是如何被视觉处理的, 如 cel- shadel, 平面图形, 半调色带, 手画、 纹理或最小化的图像 。",
            "tip": "使用此字段可使样式更加可识别, 但不更改 KTLT 显示"
          },
          "finish": {
            "guide": "完成定义图像的最后抛光和表面印记。 它可以让结果感觉干净、 优雅、 手工制作、 图像、 灰白、 毛观、 毛观、 毛观、 毛观、 毛观、 毛观、 毛观、 毛观。",
            "tip": "选择预设、 显示和显示"
          },
          "extraDetails": {
            "guide": "附加标签 suit suit",
            "tip": "使用此选项来添加“ 软编程 ” 、 “ 编辑海报感觉 ” 或“ 直接显示表面变化 ” 标签"
          },
          "customText": {
            "guide": "自定义覆盖 , 显示",
            "tip": "仅当生成的组合不够, 您需要自动启动 。"
          }
        }
      },
      "hair": {
        "overview": "发型模块控制着主题的发型、发色、发型和装饰性发型。 它有助于将发型方向与发型、姿势、表情和发型区分开来。",
        "whenToUse": "当毛发对主题、 字符设计、 时装方向、 直观的图像时, 请使用此模块 。 @ info: tooltip",
        "workflow": "以毛发样式开始定义主毛图。 然后选择毛色和毛质。 使用附加细节用于附件、 发型装饰、 特殊纹理或小修饰。 提示在您想要手动写完整毛条描述时才会使用自定义毛线 。",
        "fields": {
          "hairStyle": {
            "guide": "发型定义了主发型光束、 长度、 结构以及可识别的顶点方向 。 它会强烈影响顶点的顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 顶点、 、顶点、 顶点、顶点、顶点、 标、顶点、顶点、顶点、 、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶点、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、顶、",
            "tip": "在颜色和质地之前选择它。 Name"
          },
          "hairColor": {
            "guide": "发色定义了主题的发型。 它可以是自然的, 以幻想为基础的, 或匹配的彩色颜色 。",
            "tip": "对,用自然的颜色"
          },
          "hairTexture": {
            "guide": "发质定义了毛线的物理行为,如直发、卷发、卷发、卷发、卷发、卷发、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压、高压。",
            "tip": "使用纹身使 更具体和可信。"
          },
          "extraDetails": {
            "guide": "附加标记",
            "tip": "用这个来做贴纸 贴纸 贴纸 贴纸 贴纸 贴纸"
          },
          "customText": {
            "guide": "自定义覆盖 。",
            "tip": "标签 :"
          }
        }
      },
      "deformation": {
        "overview": "变形模块控制着对象的身体、 面部、 比例、 音量和结构是如何创造性地转变的。 它对于结构化的肖像、 字符设计、 夸大变形、 超现实的数字、 玩具式、 几何重新解释 、 图像到图像编辑 需要控制扭曲 非常有用 。",
        "whenToUse": "当主题不完全现实时使用此模块。 当您想要夸张、 抽象、 幼稚平面、 块状体、 低微几何、 重力阻断形式、 滑稽幽默、 时尚漫画 或其他可见的结构变化时, 使用此模块特别有用 。",
        "workflow": "首先选择变形类别, 然后选择特定的变形项目 。 使用额外细节来描述变形应该感觉到的强度、 干净性、 混乱性、 幽默性、 编辑性或超现实性 。 切换颜色",
        "fields": {
          "category": {
            "guide": "该类别界定了一般的变形型,如几何、超现实、漫画、块状、低质、类似儿童型、刻画或材料型的变形。",
            "tip": "选择标签, 在标签上显示更改方向"
          },
          "item": {
            "guide": "此项定义了将适用于该主题的确切变形行为, 如移动平面、 幼体部件、 展延形状、 浮形肢体、 夸大比例、 高端刻度、 简化的外观刻度、 高端刻度、 高端刻度、 高端刻度、 高端刻度、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高端、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、 高、",
            "tip": "使用此字段来控制可见的转换。 如果结果太混乱, 则保留此标签, 并减少显示显示显示"
          },
          "extraDetails": {
            "guide": "附加显示 显示 显示 显示",
            "tip": "用于强度、 方向、 身体区域、 对称性、 可读性、 类似“ 保持可识别的面孔” 或“ 避免丢失主题的光头 ” 、 启动"
          },
          "customText": {
            "guide": "自定义覆盖将自动显示显示显示显示",
            "tip": "标签标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签"
          },
          "deformationStyle": {
            "guide": "变形样式定义了用于此主题的具体变异行为, 如夸大比例、 移动几何平面、 幼虫形式、 超现实的变形、 悬浮的四肢、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形、 斜形的变形的变形、 斜形的变形、 斜形的变形的变形、 斜形的变形的变形、 斜形的变形的变形的变形、 斜形的变形的变形、 斜形的变形的变形、 斜的变形的变形的变形的变形的变形、 变形的变形的变形的变形的变形的变形的变形、 变形的变形的变形的变形的变形的变形的变形的变形的变形的变形、的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的变形的",
            "tip": "使用此字段来控制对象的明显变化 。 显示显示显示"
          }
        }
      },
      "framing": {
        "overview": "设置模块可以控制对象在图像中的位置。 它可以定义图像大小、 角度、 构成、 平衡, 以及图像显示的大小 。",
        "whenToUse": "使用此模块时, 配置很重要 。 对于肖像、 类似产品字符、 全体转换、 编辑布局、 对称的构成, 以及需要特定作物的提示, 如头部和肩部、 胸围射击、 中位射击或全身, 都特别重要 。",
        "workflow": "首先选择框架类别, 然后选择具体的框架项目 。 使用额外细节来澄清刻度、 平衡、 负空格、 主题位置, 或是否应该给您带来质点 。 标签是显示 质点、 动态、 电影、 中心或编辑 。",
        "fields": {
          "category": {
            "guide": "该类别定义了主要框架型群, 如光标作物、 身体作物、 相片角度、 结构型群、 直径直标、 直径直标、 直径直标、 直径直标、 直径直标、 直径直标、 直径直标、 直径直标、 直径直标、 直径直标、 直径直标、 直标、 直径直标、 直标、 直径直标、 直径直标、 直标、 直径直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 、 直标、 、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直标、 直、 直标、 直、 直、 直、 直、 直、 直、 直、 直标、 标、 直标、 、 直、 直、 直、 直、 直、 直、 直、 直、 直、 直、 、 直、 直、 直、 直、 直、 直、 直、 直、 直、 直、 直、 、 、 、 直、 直、 直、 直、 直、 直、 直、 直、 直、 、 、 、 直、 直、 直、 直、 直、 直、 、 直、 、 直、 直、 直、 直、 直、 直、",
            "tip": "选择一个类别,最要紧的是: 相机有多近, 如何显示对象 。"
          },
          "item": {
            "guide": "此项目定义了精确的设置指示, 如关节、 头和肩、 胸围射击、 全身、 低角度、 中心直观、 直观的直观、 直观的直观、 负空格 。",
            "tip": "这个领域是防止意外的。"
          },
          "extraDetails": {
            "guide": "附加 supple supple supple supple",
            "tip": "使用这个来做笔记 比如“ 保持整个头部的可见性 ” , “ 离开对象周围的空间 ” , “ 平衡的画框 ” , 或“ 避免切切手 ” 。"
          },
          "customText": {
            "guide": "自定义覆盖 将生成的框架输出 设置 标注 标注",
            "tip": "当它需要非常精确的控制, 特别是图像到图像提示 或刻画"
          },
          "framingStyle": {
            "guide": "缩放样式 缩放缩放缩放",
            "tip": "使用此字段来防止不想要的裁剪 。 当图像必须显示头部、 肩膀、 上身、 满身的刻画 , 或显示一个平衡的刻画板 。"
          }
        }
      },
      "expression": {
        "overview": "表达式模块控制着对象的面部情绪、 态度和可读性。 它有助于将面部表现与表面、 风格、 光质和面部显示的面部效果区分开来, 直观、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部、 面部",
        "whenToUse": "使用此模块来传达特定的感觉、 个性、 反应或字符姿态。 它对于图像、 字符表、 时装漫画、 电影图像、 表达式图像化和转换提示 来说非常有用, 显示图像必须保持可读性 。",
        "workflow": "首先选择表达式类别, 然后选择特定的表达式项目。 使用额外细节来控制强度、 微妙性、 眼睛行为、 嘴部形状、 情感音调, 或者表达式是否应该感觉自然、 戏剧性、 奇怪、 平静或夸大 。",
        "fields": {
          "category": {
            "guide": "这个类别界定了广泛的情感,例如平静、自信、令人震撼、紧张、紧张、尖锐。",
            "tip": "在选择精度表达式前选择感官方向, 使图像显示显示显示显示"
          },
          "item": {
            "guide": "此项目定义了准确的面部表现, 如中性平静、严酷的强力、玩耍的光, 震惊的夸大, 尖牙强度, 直截了当, 直截了当的尖尖, 外星的尖牙, 或面罩般的表情。",
            "tip": "使用微妙的表达方式来显示真实的图像, 并使用更强烈的表达方式来显示显示显示显示的提示 。"
          },
          "extraDetails": {
            "guide": "附加面部缩略图 缩略图 缩略图",
            "tip": "用它来做细节,比如眼神接触,眉毛紧张,嘴部形状, 情绪约束, 或夸大尖尖尖的尖尖的尖尖尖"
          },
          "customText": {
            "guide": "自定义覆盖 。",
            "tip": "讽ии碞硂"
          },
          "expressionStyle": {
            "guide": "表达风格定义了对象的面部表现和情绪,例如冷静、自信、玩耍、震惊、尖锐、怪异、戏剧性、高尖、高尖、高尖、高尖或夸大。",
            "tip": "使用此字段使脸部显示清晰。 对于现实的肖像, 保持表达式控制 。 对于文艺化的提示, 显示显示效果更好 。"
          }
        }
      },
      "pose": {
        "overview": "Pose 模块控制对象的身体位置、 姿态、 姿势、 平衡和运动。 它有助于定义对象是否感到轻松、 正式、 动态、 强大、 不对称、 扭曲、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 、 显示、 或编辑、 显示、 显示、 、 显示、 、 显示、 显示、 显示、 或编辑、 显示、 显示、 、 、 显示、 显示、 、 、 显示、 、 、 显示、 显示、 显示、 显示、 显示、 显示、 、 、 显示、 显示、 显示、 以及、 显示、 、 、 、 、 、 、 或、 、 、 、 、 、 、 、 、 、 、 或、 、 、 、 、 、 、 、 、 、 、 、 或、 、 、 、 、 、 、 、 、 或或或或是、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 或编辑、 、 、 、 、 、 、 、",
        "whenToUse": "当身体语言重要时使用此模块。 它对于全体提示、 时装布置、 字符设计、 动态动作、 编辑肖像、 图像到图像的转换, 以及要保持主题姿态可读的提示特别有用 。",
        "workflow": "从姿势类别开始, 然后选择特定的姿势项。 使用额外细节来控制手势、 重量分布、 动作、 僵硬、 优雅、 平衡、 姿势、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 或跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 跳动、 、 跳动、 跳动、 跳动、 、 、 跳动、 跳动、 跳动、 、 、 跳动、 跳动、 跳动、 跳动、 跳、 跳、跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、 跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳、跳",
        "fields": {
          "category": {
            "guide": "该类别界定了广泛的身体语言家庭,如随意、对称、动态、坐姿、编辑、高压、高压或高压、高压、高压、高压、高压、高压、高压。",
            "tip": "依据您想要的 CALL 类型"
          },
          "item": {
            "guide": "此项定义了确切的姿势行为, 如轻重转换、 前方对称姿势、 反向偏差、 动态偏差、 编辑偏斜、 倾斜倾斜、 倾斜倾斜、 倾斜的姿势、 倾斜的姿势、 倾斜的姿势、 倾斜的姿势、 倾斜的姿势 。",
            "tip": "对于图像提示,保持 与引用,但保留"
          },
          "extraDetails": {
            "guide": "附加标签 :",
            "tip": "用它来摆设,肩膀,姿势僵硬, 运动方向,平衡,或者像“保持姿势”"
          },
          "customText": {
            "guide": "自定义覆盖 。",
            "tip": "当目标显示时,"
          },
          "poseStyle": {
            "guide": "Pose Stylor 定义对象的姿势, 平衡, 动作, 姿态, 以及总体的姿势",
            "tip": "使用此字段来控制对象的物理能量。 使外观与设置相容, 特别是在图像显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 显示、 、 显示、 显示、 、 显示、 、 、 、 显示、 、 、 、 、 、 或、 或、 、 显示、 显示、 显示、 、 、 或、 、 、 、 、 、 、 、 、 、 或、 或、 或、 或、 、 、 或、 或、 或、 或、 或、 或、 、 、 、 、 或、 或、 或、 、 、 或、 或、 或、 、 、 、 、 、 或、 或、 、 、 、 、 、 、 、 或、 或、 或、 或、 或、 或、 或、 或、 或、 、 或、 或、 或、 或、 或、 或、 或、 或、 或、 或、 或、 或、 、 或、 或、 或、 或、 或、 或、 或、 或、 或、 或、 或、 或、 或、"
          }
        }
      },
      "outfit": {
        "overview": "外装模块控制着服装、制服、时装方向和可穿戴的外型。 它将外装设计与外观、毛发、纹理和总体图像风格分开。",
        "whenToUse": "当服装影响对象的身份、角色、时代、情绪、职业、时尚类别或视觉主题时,使用这个模块。 它对于肖像、字符设计、时装提示、服装、制服和它们转换很有用。",
        "workflow": "首先选择装备类别, 然后选择特定的装备项目。 使用额外细节用于布料笔记、 附件、 分层、 适配、 文化风格、 时代、 颜色或小衣物的精细。 使用自定义重写来完整手动装备描述 。",
        "fields": {
          "category": {
            "guide": "该类别界定了宽敞的服装家庭,如临时、正规、运动、街道服装、古董、制服、族裔、服装、男性、女性服装或头巾。",
            "tip": "选中此项 。"
          },
          "item": {
            "guide": "这件衣服界定了确切的服装方向,如连帽衫、牛仔服、校服、礼服、公主服装、超级英雄服装、中世纪盔甲、或Sci-fi服装。",
            "tip": "使用此项目使衣柜足够具体 使该模型 了解盖子的盖子"
          },
          "extraDetails": {
            "guide": "附加 supple supple supple supple",
            "tip": "贴上毛巾、毛巾、彩色口音、鞋类、首饰或贴上毛巾"
          },
          "customText": {
            "guide": "自定义覆盖, 将自控覆盖 。",
            "tip": "顶顶顶顶顶顶顶顶顶顶"
          },
          "outfitStyle": {
            "guide": "外衣设计 服装 服装 服装 衣物 服装 服装 服装 服装 服装",
            "tip": "使用此域, 显示您所选择的"
          }
        }
      },
      "background": {
        "overview": "背景模块控制着环境、背景、大气、周围空间和主题背后的视觉环境。 它有助于定义图像是否像一个清洁的工作室肖像、自然户外场景、抽象海报、编辑设置、内部空间或大气世界。",
        "whenToUse": "当主题需要明确的设置或背景支持故事、情绪、调色板、照明或构件时,使用此模块。 它对于肖像、字符图像、类似产品制作、编辑海报和电影场景特别有用。",
        "workflow": "从背景类别开始, 然后选择特定的背景项目。 使用额外细节来控制深度、 简单、 大气、 模式、 纹理、 环境道具 , 或者背景应该受到多大的关注 。",
        "fields": {
          "category": {
            "guide": "该类别界定了大背景,如清洁工作室、梯度、内部、抽象模式、夜空、纸质或电影般的刻度。",
            "tip": "选择主题应该成为主焦点的简单类别。 标签"
          },
          "item": {
            "guide": "此项目定义了准确的背景处理, 如无缝工作室背景、 软中性背景、 梯度环境场、 海洋地平线、 现代工作室内部、 重复模式、 纹理纸、 灰色纸或夜空 。",
            "tip": "使背景与图像和光线相容,使最终的图像在拍摄时产生着刻刻刻。"
          },
          "extraDetails": {
            "guide": "附加 supple supple supple",
            "tip": "使用此选项来进行深度、 模糊度、 道具、 颜色情绪、 简单度、 质地、 比例、 大气或笔记, 类似“ 显示不转移话题 ” 提示"
          },
          "customText": {
            "guide": "自定义覆盖 。",
            "tip": "当环境有一个非常具体的场景,位置,或艺术方向。"
          },
          "backgroundStyle": {
            "guide": "背景样式定义了该主题背后的环境的具体直观处理,例如一个清洁的工作室背景、梯度场、纹理纸、自然场景、内部空间、抽象模式或大气环境。",
            "tip": "使用此字段来控制背景方向, 而不增加提示 。"
          }
        }
      },
      "lighting": {
        "overview": "光学模块控制着光学、 影子行为、 情绪、 对比、 光学、 方向和视觉戏剧。 它强烈地影响着光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 光学、 以及图像的感官等。 它强烈地影响着现实、 光学、 光学、 和光学、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、",
        "whenToUse": "当图像需要特定情绪或专业照明设置时, 请使用此模块 。 它对于工作室肖像、 电影场景、 类似产品的转换、 戏剧性转换、 软编辑图像、 亮线外观、 形状或纹理必须清晰可读的图像 非常有用 。",
        "workflow": "首先选择照明类别, 然后选择特定的照明项目。 使用额外细节来澄清方向、 软性、 对比度、 颜色温度、 边缘光度、 体积效应、 阴影强度, 或者照明是否应该感觉自然、 电影般的光度 。",
        "fields": {
          "category": {
            "guide": "该类别界定了广度照明,例如自然光、工作室光、高档、低档、电灯、电灯、电灯、电灯、电灯等。",
            "tip": "端点标签 端点标签 端点标签"
          },
          "item": {
            "guide": "该物品定义了确切的照明装置,例如软散射灯、窗口灯、美容碟、三点照明、反光环、长环电影光、荧光线或体积光束。",
            "tip": "亮光应该支持材料和风格。例如,光亮的表面需要与显示显示的表面不同。"
          },
          "extraDetails": {
            "guide": "附加说明 上 栏 上 栏",
            "tip": "光线显示 光线显示 光线显示 光线显示 光线显示 光线显示"
          },
          "customText": {
            "guide": "自定义覆盖 , 自动覆盖 。",
            "tip": "需要特别的灯光 或电影"
          },
          "lightingStyle": {
            "guide": "照明风格定义了主要的照明装置,包括软性、对比度、方向、情绪、影子行为、彩色、边缘光、工作室光、彩色、自然光或电影照明。",
            "tip": "使用此域来塑造图像的情绪和物质可读性。 照明应支持选中的样式和纹理 。"
          }
        }
      },
      "camera": {
        "overview": "相机模块控制着相机类型、 镜头行为、 光学视角、 场面深度、 图片捕获语言。 它有助于让图像感觉像 显示图像的设置, 而不仅仅是显示图像的风格 。",
        "whenToUse": "当视野、镜头压缩、视野、模糊、现实或图片感应时,使用这个模块。 它对于肖像、产品制作、电影场景、宏观拍摄、宽角扭曲、电影外观和专业工作室风格的提示很有用。",
        "workflow": "首先选择相机类别, 然后选择特定的相机或镜头项 。 使用额外细节来描述字段的深度、 焦点行为、 焦距感觉、 胶片粒、 传感器风格, 或者图像是否应该感受到图片、 电影、 宏、 扭曲或清洁 。",
        "fields": {
          "category": {
            "guide": "该类别定义了大相镜头或镜头组合, 如光谱镜头、宽角、 宏、 鱼眼、 斜斜斜斜斜的斜斜斜的斜斜斜的斜斜斜的斜斜斜的斜斜斜的斜斜的斜斜的斜斜的斜斜的尖尖 DSLR, mirrorless, film camera, or vintage photographic look.",
            "tip": "根据视野选择标签, 而非图像标签 。"
          },
          "item": {
            "guide": "此项目定义了精确的相机或镜头行为, 如 50 mm 镜头、 85 mm 肖像镜头、 宏镜、 鱼眼、 35 mm 胶片外观、 浅浅的外观、 直观的外观、 或一次性的相机风格 。",
            "tip": "使用较长的肖像镜来压缩。 当您故意要显示扭曲或显示显示图像时, 使用宽角或鱼眼 。"
          },
          "extraDetails": {
            "guide": "附加 Flickr 标签 supple supple supple",
            "tip": "用它来控制球场的深度 胶片粒 透视器 感应器"
          },
          "customText": {
            "guide": "自定义覆盖 。",
            "tip": "使用此相机设置, 并使用电磁电图"
          },
          "cameraStyle": {
            "guide": "相机样式 定义图像的图片或光学行为, 包括镜头类型、 抓取风格、 视野、 显示位置、 显示位置、 显示位置、 显示位置",
            "tip": "当镜头角度重要时使用此字段。 纵向镜头可以创建更清洁的焦点主题, 而宽角、 直角、 直角、 直角或电影风格则可以创建更具体的直观的直观显示标记 。"
          }
        }
      },
      "colorPalette": {
        "overview": "Colorette 模块控制主要颜色系统、 和谐度、 温度、 对比度, 以及如何分配 Color 标签覆盖的颜色、 背景、 服装、 彩色、 彩色、 彩色、 彩色、 彩色",
        "whenToUse": "当图像需要受控的颜色身份时使用此模块。 它对于编辑图像、 类似品牌的视觉、 标准化肖像、 玩具设计、 时装提示、 海报、 电影情绪 以及避免随机颜色选择的任何提示特别有用 。",
        "workflow": "开始选择主调色板方向或和谐。 然后用任务、 温度、 对比度或额外的颜色注释来调整调色板行为 。 使用额外细节来描述口音颜色、 背景颜色行为或颜色限制 。",
        "fields": {
          "colorPalette": {
            "guide": "彩色调色板定义图像的总体颜色, 如单色、 糊色、 土质、 静音、 电影、 补充性、 类似性, 或其他调色板系统 。",
            "tip": "使用此字段来保持图像的视觉统一, 并开始显示显示显示"
          },
          "palette": {
            "guide": "调色板定义图像的总体颜色, 如单色、 糊涂、 土质、 充满活力、 哑巴、 电影、 补充性、 类似、 彩色、 其它调色板系统 。",
            "tip": "使用此字段来保持图像的视觉统一, 并开始显示显示显示"
          },
          "assignment": {
            "guide": "任务控制了选中的颜色如何分布于图像中, 如主题、 衣服、 背景、 头饰、 头饰、 头饰等 。",
            "tip": "调色板好时使用调色板, 但模式需要更明确的调色板标签, 显示显示调色板的颜色 。"
          },
          "colorPaletteAssignment": {
            "guide": "调色板任务控制了选中的颜色如何在图像中分布, 如主题、 服装、 背景、 亮点、 阴影、 显示显示显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的颜色、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 和/ 、 或显示的、 显示的、 显示的、 显示的、 和//、 、 显示的、 或//、 显示的、 显示的、 和//、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 和//、 和//、 或、 显示的、 、 、 、 和//、 、 、 、 、 、 显示的、 、 、 显示的、 、 、 和、 和/、 和、 、 、 、 、 、 、 、 、 、 和//、 或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或或显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 显示的、 、 、 显示的、",
            "tip": "调色板好时使用调色板, 但模式需要更明确的调色板标签, 显示显示调色板的颜色 。"
          },
          "extraDetails": {
            "guide": "附加 Flickr 显示显示显示显示的端点",
            "tip": "用于口音颜色, 避免颜色, 背景颜色笔记, 对比度, 饱和度, 或调色板标签"
          },
          "customText": {
            "guide": "自定义调色板输出",
            "tip": "端口 :"
          },
          "paletteAssignments": {
            "guide": "调色板任务 定义了选中的颜色如何在图像中分布, 如 主题、 服装、 背景、 标签、 亮点、 标签",
            "tip": "当调色板正确时使用此字段, 并显示显示显示的颜色 。"
          }
        }
      },
      "effects": {
        "overview": "效果模块控制其他的视觉效果、覆盖、大气处理、图形增强、发光、粒子、扭曲、运动、镜头装置以及覆盖在主要图像上的图像的图像",
        "whenToUse": "当图像需要额外的大气、运动、魔法、能量、编辑冲击、电影般的抛光或图形处理时, 使用此模块。 它应该支持图像, 而不是替换核心风格、 照明或背景 。",
        "workflow": "首先选择效果类别, 然后选择特定效果项。 使用额外细节来控制强度、 位置、 微妙度、 方向、 比例、 不透明性, 或者效果是否应该感觉现实、 图形、 魔术、 电影或实验性 。",
        "fields": {
          "category": {
            "guide": "该类别界定了大波波系,如大气、颗粒、光、运动、扭曲、透镜效应、粘土图案、粘土图案、粘土图案或神奇电磁。",
            "tip": "依据图像添加的类别 : 状态、 运动、 光滑、 图像"
          },
          "item": {
            "guide": "此项定义了准确的效果行为, 如尘埃粒子、 开花光、 染色体畸变、 半调外溢、 运动模糊、 发烟、 发烟、 发光、 发光、 发光、 发光等 。",
            "tip": "控制效果 太多的强烈效果 影响"
          },
          "extraDetails": {
            "guide": "附加 supple supple supple",
            "tip": "使用此选项, 位置, 颜色, 方向, 或笔记, 如“ subtle ” 和“ 不覆盖面部 ” 。"
          },
          "customText": {
            "guide": "自定义覆盖 :",
            "tip": "讽ии碞硂"
          },
          "effectIntensity": {
            "guide": "效果强度控制着屏幕上显示的屏幕效果 。",
            "tip": "使用细微的强度来打印输出。 只有当效果要成为图像显示的标记时, 才会使用更强烈的强度 。"
          },
          "effectStyle": {
            "guide": "效果样式定义了在主图像顶部应用的额外视觉效果的类型,如光、粒子、烟雾、运动、扭曲、覆盖、镜头式悬浮、悬浮、悬浮、悬浮、悬浮、悬浮、悬浮、悬浮、悬浮、悬浮、悬浮、悬浮等。",
            "tip": "使用效果支持图像状态, 不替换 CLOT 、 光栅 、 头板、 头盘、 头盘、 头盘、 头盘、 头盘"
          }
        }
      },
      "texture": {
        "overview": "质地模块控制着材料、表面质量、细节水平、不完善和触觉视觉行为。 它有助于图像感觉像胶质、粘土、金属、木材、织物、纸张、陶瓷、玻璃、橡胶、石头或其他物理材料。",
        "whenToUse": "当主题或对象的表面重要时使用此模块。 它对于玩具设计、 3D 制造、 雕塑、 粘土字符、 类似产品的视觉、 手工制作的样式、 材料研究以及触觉细节应该可见的提示特别有用 。",
        "workflow": "首先选择基础材料, 然后用表面、 细节水平和不完善性来进行精细化。 使用额外细节来澄清质地应该在哪里出现, 它应该有多强, 以及它应该感到干净、 手工制作、 年老、 擦亮、 粗糙还是磨损 。",
        "fields": {
          "material": {
            "guide": "材料界定了标的物或对象的物质,如:灰尘、陶瓷、金属、木材、石块、玻璃、纤维、皮革、纸质、橡胶或金属材料。",
            "tip": "在表面和不完善之前选择材料, 因为其它的质地设置应该能够让 Kate 上刻上"
          },
          "surface": {
            "guide": "表面界定了材料的外触觉质量,如光滑、毛发、光滑、刺青、多孔、刷子、锤子、霜状、擦亮、破碎、皱纹或折痕。",
            "tip": "表面对光与对象的相互作用有强烈影响。 QTL"
          },
          "detailLevel": {
            "guide": "详细级别控制着质地信息如何可见, 从微妙的表面行为到高强度的触摸细节 。",
            "tip": "使用细微的细节来制造纯净的标注。"
          },
          "imperfections": {
            "guide": "不完美增加了一些现实的或手工的违规现象,如刷子、芯片、帕蒂纳、刮痕、剥皮、氧化、裂缝或手工制造的小缺陷。",
            "tip": "不完美会使材料更可信,但太多的图像会显得肮脏或高难度。"
          },
          "extraDetails": {
            "guide": "附加图案,不替换显示的图案",
            "tip": "使用此选项来做笔记, 如“ 仅用在衣服上 ” 、 “ 面部可见 ” 、 “ 软垫完成 ” 、 “ 手工制作的下层变异 ” 、 或“ 避免反射表面 ” 。"
          },
          "customText": {
            "guide": "自定义覆盖 。",
            "tip": "当材料和表面行为 需要非常具体的手动描述。"
          }
        }
      }
    }
  },
  "tools": {
    "imageVectorizer": {
      "title": "图像矢量器",
      "subtitle": "将简易标签和低彩色图像转换到可编辑的标签 SVG 标签栏",
      "empty": {
        "title": "丢弃一个图像",
        "description": "选择 PNG, JPG,或带有简单背景和数量有限的标注的标注",
        "action": "选择图像"
      },
      "selected": {
        "details": "{width} × {height}国家 国家 国家 国家 {size}"
      },
      "palettePicker": {
        "presets": "当前",
        "confirm": "应用颜色",
        "cancel": "取消"
      },
      "actions": {
        "replace": "替换图像",
        "clear": "删除图像",
        "pickBackground": "选择背景",
        "cancelPicker": "取消选择",
        "autoBackground": "使用自动",
        "download": "下载 SVG",
        "processing": "楼面 SVG...",
        "editPaletteColor": "变化 {color}",
        "keepCurrentImage": "保留当前图像",
        "replaceWithClipboard": "盖上",
        "processingImage": "楼面 PNG...",
        "downloadPng": "下载 PNG"
      },
      "contextMenu": {
        "downloadSvg": "下载 SVG",
        "copySvg": "复制 SVG 代码",
        "downloadPng": "下载降色 PNG",
        "copyPng": "缩放的颜色 PNG",
        "pasteImage": "粘贴图像",
        "removeImage": "删除图像",
        "copyConfig": "复制配置",
        "pasteConfig": "粘贴"
      },
      "controls": {
        "maxColors": "最大颜色",
        "maxColorsHint": "输出调色板被降为此数, 除非启用“ 调色板” 。",
        "colorTolerance": "颜色容度",
        "colorToleranceHint": "高值合并 JPEG 高高在上 高在上 高在上",
        "strictColorLimit": "拒绝超过颜色限制的图像",
        "strictColorLimitHint": "启用时, 处理停止, 而不是用检测到的颜色降低图像 。 @ label",
        "removeBackground": "删除背景",
        "trimCanvas": "剪贴画布",
        "trimCanvasHint": "禁用此选项以保存原始的刻度 。",
        "padding": "输出",
        "minRegionSize": "最低区域面积",
        "minRegionSizeHint": "属于这种规模的CLUT-CLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GLT-GT-GLT-GT-GLT-GT-G-GLT-G-GF-G-G-GLT-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-G-电压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压的压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压的压压压压压压压压压压压压的压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压压",
        "smooth": "路径平滑",
        "smoothHint": "分析直线、 曲线和受保护的角。 更高值的曲线和楼梯边缘不会在故意间断的情况下进行整齐 。",
        "edgeCleanup": "边清理",
        "edgeCleanupHint": "边上有薄薄的像素 边上有光环",
        "removeEnclosedBackground": "删除附件",
        "removeEnclosedBackgroundHint": "切除被困在外形中的彩色区域,如彩虹、彩虹和彩虹。",
        "refineSvg": "调整 SVG",
        "refineSvgHint": "应用 SVG- 级级改进,缩小追踪区域之间的小差距。",
        "enhanceLowRes": "增强低 Res 图像",
        "enhanceLowResHint": "在矢量化前改进小图像或低分辨率图像,以回收端点",
        "lowResRecovery": "低回收",
        "lowResRecoveryHint": "控制工具在追踪图像前 如何重建丢失的细节。",
        "lowResScale": "缩放",
        "lowResScaleHint": "在跟踪前升级低分辨率输入。 高值可改进端点的恢复, 但可降低端点 。 @ info: whatsthis",
        "smoothMode": "平滑的",
        "smoothModeHint": "选择在降缩前、降缩后,还是在启用低频增强时,在两个阶段进行平滑。",
        "mode": "工具模式",
        "refineImage": "修改图像",
        "refineImageHint": "填充狭小的弧形缝隙,并将孤立的像素附在它们占主导地位的邻近地区。",
        "edgeSmooth": "边平滑",
        "edgeSmoothHint": "平滑的楼梯阶梯边框,不将索引颜色混在一起。"
      },
      "values": {
        "colors": "{count} 颜色",
        "auto": "自动",
        "smoothMode": {
          "pre": "预平滑",
          "post": "平滑后",
          "both": "两人"
        },
        "mode": {
          "vectorize": "向量",
          "upscale": "升级"
        }
      },
      "preview": {
        "original": "最初日期",
        "quantized": "降低颜色预览",
        "vector": "SVG 预览",
        "empty": "未选中图像",
        "pending": "处理后将显示预览 。",
        "pickHint": "单击 Kate 原始图像的背景颜色。",
        "upscaled": "升级预览"
      },
      "result": {
        "palette": "检测到的调色板",
        "details": "SVG: {width} × {height}国家 国家 国家 国家 {colors} 颜色 : {regions} 区域",
        "optimization": "路径点从 {before} 页:1 {after} ({percent}%).",
        "upscaleDetails": "PNG: {width} × {height}国家 国家 国家 国家 {colors} 颜色 : {regions} 区域",
        "outputColors": "{count} 输出颜色"
      },
      "status": {
        "loading": "正在装入图像...",
        "processing": "正在分析颜色和路径",
        "ready": "SVG 预览完毕",
        "svgCopied": "SVG 端口 :",
        "pngCopied": "降色 PNG 复制到剪贴板 。",
        "configCopied": "电源控制器配置已复制到 Ctal",
        "configPasted": "传呼机",
        "upscaleReady": "升级 PNG 已经准备好了"
      },
      "messages": {
        "unsupportedFile": "选择支持的 PNG, JPG,WebP,,,, GIF, BMP,或, AVIF 摆琌摆琌摆",
        "colorLimitTitle": "检测到太多颜色",
        "colorLimitExceeded": "此图像包含 {detected} 颜色组, 超过 {max}。增加颜色容度或最大颜色计数,禁用严格模式,或选择更简单的图像。",
        "processingFailed": "图像无法向量化。 尝试一个更简单的图像, 增加颜色容忍度, 或减少输入尺寸 。",
        "clipboardUnavailable": "此动作的剪贴板权限不为此浏览器支持 。",
        "clipboardPermissionDenied": "拒绝剪贴板权限。 允许剪贴板访问并再次试 。 @ info: whatsthis",
        "clipboardWriteFailed": "无法将输出复制到剪贴板 。",
        "clipboardReadFailed": "无法读取 。",
        "noClipboardImage": "剪贴板不包含图像 。",
        "invalidConfig": "剪贴板不包含有效的图像矢量器配置 。",
        "replaceClipboardImageTitle": "替换当前图像 ?",
        "replaceClipboardImageConfirm": "粘贴新剪贴板图像将取代当前源图像及其当前结果 。"
      },
      "progress": {
        "preparing": "准备...",
        "enhancing": "增强形象",
        "quantizing": "标注的颜色",
        "background": "正在检测背景...",
        "regions": "建筑区...",
        "tracing": "追踪形状...",
        "svg": "正在生成 SVG...",
        "preview": "正在生成预览...",
        "finalizing": "正在最后确定...",
        "refiningImage": "不断完善的...",
        "smoothingEdges": "电磁电磁电击"
      }
    },
    "imageConverter": {
      "title": "图像转换器",
      "subtitle": "上传图像, 选择输出设置, 并下载所有已转换的文件 ZIP.",
      "empty": {
        "title": "将图像放在这里",
        "description": "将图像拖放到此区域, 或者从您的设备中选择文件 。",
        "action": "选择图像"
      },
      "selected": {
        "count": "{count} 选中的文件",
        "totalSize": "总规模 : {size}"
      },
      "actions": {
        "addMore": "添加文件",
        "clearAll": "全部",
        "viewFiles": "查看文件",
        "download": "下载 ZIP",
        "downloading": "准备 ZIP..."
      },
      "controls": {
        "format": "输出格式",
        "quality": "输出质量"
      },
      "formats": {
        "jpg": "JPG",
        "webp": "网络"
      },
      "qualityPercent": "{quality}%",
      "status": {
        "converting": "正在转换图像...",
        "zipping": "楼面 ZIP 密码",
        "completed": "开始 ZIP 开始吧",
        "completedWithErrors": "说完了,但 {count} 无法转换 。"
      },
      "messages": {
        "noFiles": "选择至少一个图像 。",
        "noImageFiles": "没有选择支持的图像 。",
        "exportFailed": "无法转换选中的图像。 尝试不同的文件或小端点的标签 。"
      },
      "preview": {
        "title": "选中的图像",
        "subtitle": "删除任何您不想包含在转换中 。",
        "empty": "已经没有了",
        "remove": "删除图像"
      }
    },
    "about": {
      "title": "关于 Prompt Draft",
      "subtitle": "简况",
      "version": "数字 {version}",
      "description": "Prompt Draft 是一个模块化的快速构建工作空间,用于创建结构化图像生成提示,并配有可重复使用的模块、变量、草稿管理,以及用于日常创造性工作流程的小型实用工具。"
    }
  },
  "components": {
    "contextMenu": {
      "groups": {
        "draft": "草案",
        "copy": "复制",
        "variables": "开关"
      },
      "actions": {
        "expand": "展开",
        "collapse": "缩放 缩放",
        "resetSettings": "重置",
        "enableCustomize": "自定义",
        "disableCustomize": "禁用",
        "copyOutput": "复制输出",
        "removeFromKeyModules": "从密钥中删除",
        "showVariables": "显示变量",
        "refreshPage": "刷新页面"
      }
    },
    "modal": {
      "insertVariable": "插入",
      "actions": {
        "close": "关闭",
        "cancel": "取消"
      },
      "title": {
        "insertVariable": "插入、 显示、 显示",
        "insertVariableSubtitle": "选择变量并将其插入活动提示字段。"
      }
    }
  },
  "prompts": {
    "title": "快速归档",
    "description": "浏览 Prompt Draft 电报频道",
    "total": "{count} 提示",
    "results": "{count} 结果",
    "loading": "正在装入快速归档...",
    "search": {
      "placeholder": "搜索标题, 提示, 标记或 ID..."
    },
    "filters": {
      "model": "型号",
      "tag": "标记",
      "sort": "排序",
      "allModels": "所有型号",
      "allTags": "全部标记",
      "clear": "清除过滤器"
    },
    "sort": {
      "newest": "最新的",
      "oldest": "最老的"
    },
    "models": {
      "dallE": "DALL· 电子",
      "gptImage1": "GPT- 图像1"
    },
    "card": {
      "noPreview": "无预览",
      "imageCount": "{count} 图像"
    },
    "actions": {
      "telegram": "电报视图",
      "view": "查看提示"
    },
    "empty": {
      "title": "找不到提示",
      "description": "尝试一个不同的搜索条目或清除活动过滤器 。"
    },
    "error": {
      "title": "无法装入快速归档",
      "retry": "再试"
    },
    "loadMore": "装入更多({count} (仅余)",
    "view": {
      "grid": "网格视图",
      "list": "列表视图"
    },
    "items": {
      "6": {
        "title": "忧郁症表达主义者"
      },
      "14": {
        "title": "儿童般的亲手拖走巨怪"
      },
      "20": {
        "title": "Pop- Suralal 雕塑画像"
      },
      "26": {
        "title": "3D 哥特字符"
      },
      "31": {
        "title": "复古自新雕塑"
      },
      "39": {
        "title": "涂鸦铜雕塑"
      },
      "51": {
        "title": "超时尚美容院"
      },
      "60": {
        "title": "哥特语 2D 动画"
      },
      "66": {
        "title": "时装粉末"
      },
      "70": {
        "title": "电影绘画 3D 字符"
      },
      "83": {
        "title": "珊瑚- 板块停止运动"
      },
      "90": {
        "title": "彩色树雕塑"
      },
      "96": {
        "title": "哥特乌鸦肖像"
      },
      "104": {
        "title": "3D 排雷人员"
      },
      "115": {
        "title": "1950年代 广告海报"
      },
      "120": {
        "title": "1950s 纵向杂志"
      },
      "130": {
        "title": "Dystopian 动画"
      },
      "137": {
        "title": "尼昂·赛博朋克"
      },
      "143": {
        "title": "尼昂·赛博朋克"
      },
      "149": {
        "title": "3个D LEGO 世界"
      },
      "156": {
        "title": "神秘的角质"
      },
      "165": {
        "title": "权力环海报"
      },
      "172": {
        "title": "维多利亚哥德肖像"
      },
      "177": {
        "title": "维多利亚州"
      },
      "182": {
        "title": "家庭设计"
      },
      "189": {
        "title": "南公园纸字符"
      },
      "197": {
        "title": "里克和莫蒂字符"
      },
      "203": {
        "title": "剑桥王后"
      },
      "208": {
        "title": "现实的Archer女王"
      },
      "217": {
        "title": "电影 3D 哥特字符"
      },
      "224": {
        "title": "GeoToon 几何字符"
      },
      "230": {
        "title": "粘贴符三维字符"
      },
      "238": {
        "title": "3D 美杜莎字符"
      },
      "244": {
        "title": "精神离开动因样式"
      },
      "249": {
        "title": "GTA 圣安德烈亚斯海报"
      },
      "254": {
        "title": "伊玛目·雷扎·苏韦尼尔·肖莱特"
      },
      "260": {
        "title": "GTA VI 海报"
      },
      "265": {
        "title": "全体行狼者"
      },
      "271": {
        "title": "狼行者"
      },
      "277": {
        "title": "红色救赎海报"
      },
      "284": {
        "title": "红死救赎 II 字符"
      },
      "291": {
        "title": "工作室宠物肖像"
      },
      "299": {
        "title": "刻画画"
      },
      "307": {
        "title": "内昂·格拉菲蒂·阿凡达"
      },
      "313": {
        "title": "伊朗 3x4 ID 图片"
      },
      "321": {
        "title": "64比特像素"
      },
      "328": {
        "title": "整盘 32 位像素字符"
      },
      "333": {
        "title": "工作室护照"
      },
      "341": {
        "title": "平面神通"
      },
      "351": {
        "title": "长期的 Clay Figurine"
      },
      "357": {
        "title": "缩放雕刻"
      },
      "371": {
        "title": "风格匹配的圣诞礼帽"
      },
      "378": {
        "title": "圣诞老人"
      },
      "386": {
        "title": "儿童草签中的陶瓷对象"
      },
      "387": {
        "title": "添加伴侣到相片"
      },
      "401": {
        "title": "自定义现实场景"
      },
      "409": {
        "title": "活动作 Vintage 卡通字符"
      },
      "413": {
        "title": "实时汤姆和杰里风格Name"
      },
      "416": {
        "title": "专业链接"
      },
      "419": {
        "title": "专业 YouTube 缩略图"
      },
      "426": {
        "title": "3D 朋克字符"
      },
      "429": {
        "title": "扭曲的二维字符"
      },
      "430": {
        "title": "Grotesque 刻画雕刻"
      },
      "434": {
        "title": "几何 Pen-Ink 说明"
      },
      "435": {
        "title": "超真实儿童版图"
      },
      "439": {
        "title": "真实有机超现实光谱"
      },
      "441": {
        "title": "《时尚》杂志封面"
      },
      "443": {
        "title": "极端健美者"
      },
      "445": {
        "title": "电子商务产品照片"
      },
      "449": {
        "title": "产品广告海报"
      },
      "451": {
        "title": "费尔特·马里昂内特·多尔"
      },
      "452": {
        "title": "虚拟服装尝试"
      },
      "457": {
        "title": "个人化电影海报"
      },
      "461": {
        "title": "3D 时装"
      },
      "465": {
        "title": "缩放 2D 像素字符"
      },
      "466": {
        "title": "电影 CGI 纵向"
      },
      "467": {
        "title": "文本中的书封面"
      },
      "468": {
        "title": "日本街头艺术海报"
      },
      "473": {
        "title": "手工制作的竹子雕塑"
      },
      "474": {
        "title": "水彩卡通字符"
      },
      "475": {
        "title": "工作室 3D 卡通字符"
      },
      "476": {
        "title": "华莱士和格罗米特"
      },
      "477": {
        "title": "缩写镜像自控"
      },
      "478": {
        "title": "Candid 设计图"
      },
      "479": {
        "title": "铝单件字符"
      },
      "481": {
        "title": "一块神奇的水果海报"
      },
      "482": {
        "title": "长长的流行艺术字符"
      },
      "485": {
        "title": "参考位置中的自定义"
      },
      "486": {
        "title": "对象填充池式编辑器"
      },
      "487": {
        "title": "帕帕拉齐窗口"
      },
      "490": {
        "title": "3x3 表达式测试网格"
      },
      "492": {
        "title": "3x3 表达式和发型网格"
      },
      "497": {
        "title": "每天在历史时代的生活"
      },
      "501": {
        "title": "双胞胎穿花"
      },
      "502": {
        "title": "经典 80 - 90s 动画"
      },
      "503": {
        "title": "波斯微型海报"
      },
      "506": {
        "title": "精巧的蝴蝶肖像"
      },
      "507": {
        "title": "个人化塔罗牌"
      },
      "510": {
        "title": "临时双人肖像"
      },
      "511": {
        "title": "自然链接"
      }
    },
    "detail": {
      "back": "返回提示",
      "primaryVersion": "主要时间",
      "previewCount": "{count} 预览",
      "readyToUse": "准备使用",
      "copyPrompt": "复制提示",
      "copied": "收到",
      "openTelegram": "以 电图打开",
      "explorePrompt": "探索",
      "promptEyebrow": "PROMPT DNA",
      "promptTitle": "开拍,准备",
      "promptDescription": "复制提示的原样, 在可用版本之间切换, 或者使用它作为您自己的变换的起点 。",
      "promptLabel": "PROMPT",
      "modelNote": "以 {model}",
      "previous": "上一个",
      "next": "下一个",
      "notFoundTitle": "提示未找到",
      "notFoundDescription": "这么快 ID 标签名 :"
    }
  }
}
